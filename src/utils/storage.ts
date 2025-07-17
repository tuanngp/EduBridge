import { User, Donor, School, Donation, Request } from '../types';

const STORAGE_KEYS = {
  USERS: 'edubridge_users',
  DONORS: 'edubridge_donors',
  SCHOOLS: 'edubridge_schools',
  DONATIONS: 'edubridge_donations',
  REQUESTS: 'edubridge_requests',
  CURRENT_USER: 'edubridge_current_user',
};

// Users
export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Donors
export const getDonors = (): Donor[] => {
  const donors = localStorage.getItem(STORAGE_KEYS.DONORS);
  return donors ? JSON.parse(donors) : [];
};

export const saveDonor = (donor: Donor): void => {
  const donors = getDonors();
  const existingIndex = donors.findIndex(d => d.id === donor.id);
  if (existingIndex >= 0) {
    donors[existingIndex] = donor;
  } else {
    donors.push(donor);
  }
  localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
};

export const getDonorByUserId = (userId: string): Donor | null => {
  const donors = getDonors();
  return donors.find(d => d.userId === userId) || null;
};

// Schools
export const getSchools = (): School[] => {
  const schools = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
  return schools ? JSON.parse(schools) : [];
};

export const saveSchool = (school: School): void => {
  const schools = getSchools();
  const existingIndex = schools.findIndex(s => s.id === school.id);
  if (existingIndex >= 0) {
    schools[existingIndex] = school;
  } else {
    schools.push(school);
  }
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
};

export const getSchoolByUserId = (userId: string): School | null => {
  const schools = getSchools();
  return schools.find(s => s.userId === userId) || null;
};

// Donations
export const getDonations = (): Donation[] => {
  const donations = localStorage.getItem(STORAGE_KEYS.DONATIONS);
  return donations ? JSON.parse(donations) : [];
};

export const saveDonation = (donation: Donation): void => {
  const donations = getDonations();
  const existingIndex = donations.findIndex(d => d.id === donation.id);
  if (existingIndex >= 0) {
    donations[existingIndex] = donation;
  } else {
    donations.push(donation);
  }
  localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
};

export const getDonationsByDonorId = (donorId: string): Donation[] => {
  const donations = getDonations();
  return donations.filter(d => d.donorId === donorId);
};

// Requests
export const getRequests = (): Request[] => {
  const requests = localStorage.getItem(STORAGE_KEYS.REQUESTS);
  return requests ? JSON.parse(requests) : [];
};

export const saveRequest = (request: Request): void => {
  const requests = getRequests();
  const existingIndex = requests.findIndex(r => r.id === request.id);
  if (existingIndex >= 0) {
    requests[existingIndex] = request;
  } else {
    requests.push(request);
  }
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
};

export const getRequestsBySchoolId = (schoolId: string): Request[] => {
  const requests = getRequests();
  return requests.filter(r => r.schoolId === schoolId);
};

// Utility functions
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};