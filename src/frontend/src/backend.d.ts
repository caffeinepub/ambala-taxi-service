import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Ride {
    id: RideId;
    status: RideStatus;
    driverIdOpt?: DriverId;
    createdAt: bigint;
    dropLocation: string;
    estimatedFare: bigint;
    riderPhone: string;
    riderName: string;
    pickupLocation: string;
}
export interface Driver {
    id: DriverId;
    name: string;
    isOnline: boolean;
    isActive: boolean;
    carNumber: string;
    phone: string;
}
export type DriverId = bigint;
export type RideId = bigint;
export interface UserProfile {
    driverId?: DriverId;
    name: string;
}
export enum RideStatus {
    Accepted = "Accepted",
    Cancelled = "Cancelled",
    Completed = "Completed",
    Pending = "Pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptRide(rideId: RideId, driverId: DriverId): Promise<void>;
    addDriver(name: string, carNumber: string, phone: string): Promise<DriverId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteDriver(id: DriverId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDrivers(): Promise<Array<Driver>>;
    getOnlineDrivers(): Promise<Array<Driver>>;
    getRides(): Promise<Array<Ride>>;
    getRidesByStatus(status: RideStatus): Promise<Array<Ride>>;
    getRidesForDriver(driverId: DriverId): Promise<Array<Ride>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    requestRide(riderName: string, riderPhone: string, pickupLocation: string, dropLocation: string, estimatedFare: bigint): Promise<RideId>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedSampleDrivers(): Promise<void>;
    toggleDriverOnline(id: DriverId): Promise<void>;
    updateDriver(id: DriverId, name: string, carNumber: string, phone: string): Promise<void>;
    updateRideStatus(rideId: RideId, status: RideStatus): Promise<void>;
}
