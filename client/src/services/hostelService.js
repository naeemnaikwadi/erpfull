import API from './api';

export const fetchHostels = async (params = {}) => {
	const response = await API.get('/erp/hostels', { params });
	return response.data;
};

export const createHostel = async (hostelData) => {
	const response = await API.post('/erp/hostels', hostelData);
	return response.data;
};

export const fetchHostelAllocations = async (hostelId) => {
	const response = await API.get(`/erp/hostels/${hostelId}/allocations`);
	return response.data;
};

export const allocateRoom = async (hostelId, allocationData) => {
	// Backend route is /:id/allocate
	const response = await API.post(`/erp/hostels/${hostelId}/allocate`, allocationData);
	return response.data;
};

export const fetchRooms = async (hostelId) => {
	const response = await API.get(`/erp/hostels/${hostelId}/rooms`);
	return response.data;
};

export default {
	fetchHostels,
	createHostel,
	fetchHostelAllocations,
	allocateRoom,
	fetchRooms
};

