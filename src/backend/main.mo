import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type DriverId = Nat;
  type RideId = Nat;

  type Driver = {
    id : DriverId;
    name : Text;
    carNumber : Text;
    phone : Text;
    isOnline : Bool;
    isActive : Bool;
  };

  module Driver {
    public func compare(d1 : Driver, d2 : Driver) : Order.Order {
      Nat.compare(d1.id, d2.id);
    };
  };

  type RideStatus = {
    #Pending;
    #Accepted;
    #Completed;
    #Cancelled;
  };

  type Ride = {
    id : RideId;
    riderName : Text;
    riderPhone : Text;
    pickupLocation : Text;
    dropLocation : Text;
    estimatedFare : Nat;
    driverIdOpt : ?DriverId;
    status : RideStatus;
    createdAt : Int;
  };

  module Ride {
    public func compare(r1 : Ride, r2 : Ride) : Order.Order {
      Nat.compare(r1.id, r2.id);
    };
  };

  let drivers = Map.empty<DriverId, Driver>();
  let rides = Map.empty<RideId, Ride>();
  var nextDriverId = 1;
  var nextRideId = 1;

  let seededDrivers = Set.empty<Nat>();

  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
    driverId : ?DriverId;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper function to get driver ID for caller
  func getDriverIdForCaller(caller : Principal) : ?DriverId {
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { profile.driverId };
    };
  };

  // Driver Management
  public query ({ caller }) func getDrivers() : async [Driver] {
    drivers.values().toArray().sort();
  };

  public query ({ caller }) func getOnlineDrivers() : async [Driver] {
    drivers.values().filter(func(d) { d.isOnline and d.isActive }).toArray();
  };

  public shared ({ caller }) func addDriver(name : Text, carNumber : Text, phone : Text) : async DriverId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add drivers");
    };
    let driver : Driver = {
      id = nextDriverId;
      name;
      carNumber;
      phone;
      isOnline = false;
      isActive = true;
    };
    drivers.add(nextDriverId, driver);
    let id = nextDriverId;
    nextDriverId += 1;
    id;
  };

  public shared ({ caller }) func updateDriver(id : DriverId, name : Text, carNumber : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update driver");
    };
    switch (drivers.get(id)) {
      case (null) { Runtime.trap("Driver not found") };
      case (?driver) {
        let updatedDriver : Driver = {
          id;
          name;
          carNumber;
          phone;
          isOnline = driver.isOnline;
          isActive = driver.isActive;
        };
        drivers.add(id, updatedDriver);
      };
    };
  };

  public shared ({ caller }) func deleteDriver(id : DriverId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete drivers");
    };
    switch (drivers.get(id)) {
      case (null) { Runtime.trap("Driver not found") };
      case (?driver) {
        let deactivatedDriver : Driver = {
          driver with isActive = false;
        };
        drivers.add(id, deactivatedDriver);
      };
    };
  };

  public shared ({ caller }) func toggleDriverOnline(id : DriverId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle driver status");
    };
    
    // Verify ownership: caller must be the driver
    switch (getDriverIdForCaller(caller)) {
      case (null) { Runtime.trap("Unauthorized: No driver profile associated with caller") };
      case (?callerDriverId) {
        if (callerDriverId != id) {
          Runtime.trap("Unauthorized: Can only toggle your own driver status");
        };
      };
    };

    switch (drivers.get(id)) {
      case (null) { Runtime.trap("Driver not found") };
      case (?driver) {
        drivers.add(id, { driver with isOnline = not driver.isOnline });
      };
    };
  };

  // Ride Management
  public shared ({ caller }) func requestRide(
    riderName : Text,
    riderPhone : Text,
    pickupLocation : Text,
    dropLocation : Text,
    estimatedFare : Nat,
  ) : async RideId {
    // No authorization check - any user including guests can request rides
    let ride : Ride = {
      id = nextRideId;
      riderName;
      riderPhone;
      pickupLocation;
      dropLocation;
      estimatedFare;
      driverIdOpt = null;
      status = #Pending;
      createdAt = 0;
    };

    rides.add(nextRideId, ride);
    let id = nextRideId;
    nextRideId += 1;
    id;
  };

  public shared ({ caller }) func acceptRide(rideId : RideId, driverId : DriverId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept rides");
    };

    // Verify ownership: caller must be the driver accepting the ride
    switch (getDriverIdForCaller(caller)) {
      case (null) { Runtime.trap("Unauthorized: No driver profile associated with caller") };
      case (?callerDriverId) {
        if (callerDriverId != driverId) {
          Runtime.trap("Unauthorized: Can only accept rides as yourself");
        };
      };
    };

    switch (rides.get(rideId)) {
      case (null) { Runtime.trap("Ride not found") };
      case (?ride) {
        if (ride.status != #Pending) {
          Runtime.trap("Ride is not in pending status");
        };
        switch (drivers.get(driverId)) {
          case (null) { Runtime.trap("Driver not found") };
          case (?driver) {
            if (not driver.isActive or not driver.isOnline) {
              Runtime.trap("Driver must be active and online to accept rides");
            };
            let updatedRide = { ride with driverIdOpt = ?driverId; status = #Accepted };
            rides.add(rideId, updatedRide);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateRideStatus(rideId : RideId, status : RideStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update ride status");
    };

    switch (rides.get(rideId)) {
      case (null) { Runtime.trap("Ride not found") };
      case (?ride) {
        // Verify ownership: caller must be the assigned driver or admin
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        if (not isAdmin) {
          switch (getDriverIdForCaller(caller)) {
            case (null) { Runtime.trap("Unauthorized: No driver profile associated with caller") };
            case (?callerDriverId) {
              switch (ride.driverIdOpt) {
                case (null) { Runtime.trap("Unauthorized: No driver assigned to this ride") };
                case (?assignedDriverId) {
                  if (callerDriverId != assignedDriverId) {
                    Runtime.trap("Unauthorized: Can only update rides assigned to you");
                  };
                };
              };
            };
          };
        };

        rides.add(rideId, { ride with status });
      };
    };
  };

  // Filtering Rides
  public query ({ caller }) func getRides() : async [Ride] {
    // Admins can see all rides
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return rides.values().toArray().sort();
    };

    // Users can see their own rides (as driver)
    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      switch (getDriverIdForCaller(caller)) {
        case (null) { return []; };
        case (?driverId) {
          return rides.values().filter(func(r) {
            switch (r.driverIdOpt) {
              case (null) { false };
              case (?id) { id == driverId };
            };
          }).toArray();
        };
      };
    };

    // Guests can see pending rides only
    rides.values().filter(func(r) { r.status == #Pending }).toArray();
  };

  public query ({ caller }) func getRidesByStatus(status : RideStatus) : async [Ride] {
    // Admins can see all rides by status
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return rides.values().filter(func(r) { r.status == status }).toArray();
    };

    // Users can see their own rides by status
    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      switch (getDriverIdForCaller(caller)) {
        case (null) { return []; };
        case (?driverId) {
          return rides.values().filter(func(r) {
            r.status == status and (switch (r.driverIdOpt) {
              case (null) { false };
              case (?id) { id == driverId };
            });
          }).toArray();
        };
      };
    };

    // Guests can only see pending rides
    if (status == #Pending) {
      rides.values().filter(func(r) { r.status == #Pending }).toArray();
    } else {
      [];
    };
  };

  public query ({ caller }) func getRidesForDriver(driverId : DriverId) : async [Ride] {
    // Admins can see rides for any driver
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return rides.values().filter(func(r) {
        switch (r.driverIdOpt) {
          case (null) { false };
          case (?id) { id == driverId };
        };
      }).toArray();
    };

    // Users can only see their own rides
    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      switch (getDriverIdForCaller(caller)) {
        case (null) { Runtime.trap("Unauthorized: No driver profile associated with caller"); };
        case (?callerDriverId) {
          if (callerDriverId != driverId) {
            Runtime.trap("Unauthorized: Can only view your own rides");
          };
          return rides.values().filter(func(r) {
            switch (r.driverIdOpt) {
              case (null) { false };
              case (?id) { id == driverId };
            };
          }).toArray();
        };
      };
    };

    Runtime.trap("Unauthorized: Only users can view driver rides");
  };

  // Seed Sample Drivers
  public shared ({ caller }) func seedSampleDrivers() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can seed drivers");
    };

    if (seededDrivers.contains(nextDriverId)) {
      Runtime.trap("Drivers already seeded");
    };

    let sampleNames = [
      "Rajinder Sharma",
      "Sukhdev Singh",
      "Gurmeet Kaur",
      "Balbir Singh",
      "Munsha Ram",
      "Ajit Kaur",
      "Mandeep Singh",
      "Sarabjeet Kaur",
      "Bhagwan Singh",
      "Kashmira Singh",
      "Balwinder Kaur",
      "Satpal Singh",
    ];

    let carNumbers = [
      "HR01A1234",
      "HR01B5678",
      "HR01C2345",
      "HR01D6789",
      "HR01E3456",
      "HR01F7890",
      "HR01G4567",
      "HR01H8901",
      "HR01I5678",
      "HR01J9012",
      "HR01K6789",
      "HR01L0345",
    ];

    let phoneNumbers = [
      "01712456789",
      "01712567890",
      "01712678901",
      "01712789012",
      "01712890123",
      "01712901234",
      "01712012345",
      "01712123456",
      "01712234567",
      "01712345678",
      "01712456780",
      "01712567892",
    ];

    var i = 0;
    while (i < sampleNames.size()) {
      ignore await addDriver(sampleNames[i], carNumbers[i], phoneNumbers[i]);
      i += 1;
    };

    seededDrivers.add(nextDriverId);
  };
};
