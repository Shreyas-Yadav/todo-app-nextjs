'use client';
import { FaFilter } from "react-icons/fa";
import { LuArrowDownUp } from "react-icons/lu";
import { use, useEffect, useState } from 'react';
import { log } from "console";

interface Task {
    id: number;
    description: string;
    status: string;
    createdAt: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface TasksResponse {
    tasks: Task[];
    pagination: PaginationInfo;
}

export default function taskPage() {
    const statusOptions = ['pending', 'in-progress', 'completed'];
    const filterStatusOptions = ['all', ...statusOptions];
    
    const [filterStatus, setFilterStatus] = useState('all');
    const [task, setTask] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
    });
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{
        key: 'id' | 'description' | 'createdAt' | null;
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });
    
    // Loading state
    const [loading, setLoading] = useState(false);
    
    // Individual task loading and error states
    const [taskLoadingStates, setTaskLoadingStates] = useState<Record<number, boolean>>({});
    const [taskErrors, setTaskErrors] = useState<Record<number, string>>({});

    // Fetch tasks with pagination
    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                status: filterStatus,
                sortBy: sortConfig.key || 'createdAt',
                sortOrder: sortConfig.direction
            });

            const response = await fetch(`/api/actions?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch tasks');
                return;
            }

            const data: TasksResponse = await response.json();
            setTask(data.tasks);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch tasks when dependencies change
    useEffect(() => {
        fetchTasks();
    }, [currentPage, itemsPerPage, filterStatus, sortConfig]);

    const deleteTask = async (id: number) => {
        // Set loading state for specific task
        setTaskLoadingStates(prev => ({ ...prev, [id]: true }));
        
        try {
            const res = await fetch(`/api/actions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            
            if (!res.ok) {
                const response = await res.json();
                throw new Error(response.error || 'Failed to delete task');
            }
            
            // Remove task from local state - no page reload!
            setTask(prevTasks => prevTasks.filter(task => task.id !== id));
            
            // Clear any loading/error states for this task
            setTaskLoadingStates(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
            setTaskErrors(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
            
        } catch (error) {
            console.error('Error deleting task:', error);
            setTaskErrors(prev => ({
                ...prev,
                [id]: error instanceof Error ? error.message : 'Failed to delete task'
            }));
            setTaskLoadingStates(prev => ({ ...prev, [id]: false }));
        }
    };

    const addTask = async () => {
        const taskInput = (document.getElementById('taskinput') as HTMLInputElement)!.value;
        if (!taskInput.trim()) {
            alert('Please enter a task');
            return;
        }
        
        const newTask = {
            description: taskInput,
        };
        
        // Set loading state for add button
        setLoading(true);
        
        try {
            const res = await fetch('/api/actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(newTask),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add task');
            }

            const createdTaskData = await res.json();
            const createdTask = createdTaskData[0]; // API returns array with new task
            
            // Add new task to local state - no page reload!
            // Insert at beginning to match typical "newest first" behavior
            setTask(prevTasks => [createdTask, ...prevTasks]);
            
            // Update pagination count
            setPagination(prev => ({
                ...prev,
                totalCount: prev.totalCount + 1,
                totalPages: Math.ceil((prev.totalCount + 1) / prev.limit)
            }));

            // Clear input
            (document.getElementById('taskinput') as HTMLInputElement)!.value = '';
            
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Error adding task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const editTask = async (taskToEdit: Task) => {
        const newDescription = prompt('Edit task description:', taskToEdit.description);
        if (newDescription === null || newDescription.trim() === '') {
            alert('Task description cannot be empty');
            return;
        }

        if (newDescription === taskToEdit.description) {
            return; // No changes made
        }
        
        // Clear any previous errors for this task
        setTaskErrors(prev => ({ ...prev, [taskToEdit.id]: '' }));
        
        // Set loading state for specific task
        setTaskLoadingStates(prev => ({ ...prev, [taskToEdit.id]: true }));
        
        const updatedTask = {
            ...taskToEdit,
            description: newDescription,
        };

        try {
            const response = await fetch(`/api/actions/${taskToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(updatedTask),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task');
            }
            
            const updatedTaskData = await response.json();
            
            // Update only the specific task in local state - no page reload!
            setTask(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskToEdit.id
                        ? {
                            ...task,
                            description: newDescription,
                            updatedAt: updatedTaskData[0]?.updatedAt || new Date().toISOString()
                        }
                        : task
                )
            );
            
        } catch (error) {
            console.error('Error updating task:', error);
            setTaskErrors(prev => ({
                ...prev,
                [taskToEdit.id]: error instanceof Error ? error.message : 'Failed to update task'
            }));
        } finally {
            setTaskLoadingStates(prev => ({ ...prev, [taskToEdit.id]: false }));
        }
    };

    const updateTaskStatus = async (taskId: number, newStatus: string) => {
        if (!statusOptions.includes(newStatus)) {
            alert('Invalid status: ' + newStatus);
            return;
        }
        
        // Clear any previous errors for this task
        setTaskErrors(prev => ({ ...prev, [taskId]: '' }));
        
        // Set loading state for specific task
        setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));
        
        try {
            const response = await fetch(`/api/actions/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task status');
            }
            
            const updatedTaskData = await response.json();
            
            // Update only the specific task in local state - no page reload!
            setTask(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId
                        ? {
                            ...task,
                            status: newStatus,
                            updatedAt: updatedTaskData[0]?.updatedAt || new Date().toISOString()
                        }
                        : task
                )
            );
            
        } catch (error) {
            console.error('Error updating task status:', error);
            // Show user-friendly error without losing context
            setTaskErrors(prev => ({
                ...prev,
                [taskId]: error instanceof Error ? error.message : 'Unknown error'
            }));
        } finally {
            setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
        }
    };

    const handleSort = (key: 'id' | 'description' | 'createdAt') => {
        let direction: 'asc' | 'desc' = 'asc';
        
        // If clicking the same column, toggle direction
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page when sorting
    };

    const getSortIcon = (columnKey: 'id' | 'description' | 'createdAt') => {
        if (sortConfig.key !== columnKey) {
            return <LuArrowDownUp className="inline ml-2 hover:cursor-pointer" />;
        }
        
        return sortConfig.direction === 'asc'
            ? <LuArrowDownUp className="inline ml-2 hover:cursor-pointer text-green-600" />
            : <LuArrowDownUp className="inline ml-2 hover:cursor-pointer text-green-600 rotate-180" />;
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (newLimit: number) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const handleFilterChange = (newFilter: string) => {
        setFilterStatus(newFilter);
        setCurrentPage(1); // Reset to first page when filtering
    };

    return (
        <div className="flex flex-col bg-green-100 min-h-screen p-6">
            <div className="flex justify-center bg-green-100" style={{ color: '#0d141c' }}>
                <h1 className="text-4xl py-5">My Tasks</h1>
            </div>

            <div className="flex justify-center items-center bg-green-100 gap-4">
                <input
                    id="taskinput"
                    name="taskinput"
                    type="text"
                    placeholder="Enter your task"
                    className="w-80 px-4 py-2 border border-green-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <button
                    onClick={() => addTask()}
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200"
                    disabled={loading}
                >
                    Add Task
                </button>
                <div className="flex justify-right gap-2">
                    <label className="flex">
                        <FaFilter />
                        <select
                            value={filterStatus}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-2 py-1 border border-green-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            {filterStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status.replace('-', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-black">Items per page:</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        className="px-2 py-1 border border-green-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center mt-4">
                    <div className="text-green-600">Loading...</div>
                </div>
            )}

            <div className="flex flex-col items-center mt-6 w-full">
                <table className="table-auto w-3/4 bg-white shadow-md rounded-lg overflow-hidden text-black">
                    <colgroup>
                        <col className="w-3/20"/> 
                        <col className="w-7/20"/>
                        <col className="w-3/20"/>
                        <col className="w-3/20"/> 
                        <col className="w-4/20"/> 
                    </colgroup>
                    <thead className="bg-green-300 text-black">
                        <tr>
                            <th className="px-5 py-3 text-center">
                                Task ID
                                <span onClick={() => handleSort('id')}>
                                    {getSortIcon('id')}
                                </span>
                            </th>
                            <th className="px-5 py-3 text-center">
                                Task Description
                                <span onClick={() => handleSort('description')}>
                                    {getSortIcon('description')}
                                </span>
                            </th>
                            <th>Status</th>
                            <th className="px-5 py-3 text-center">
                                Created At
                                <span onClick={() => handleSort('createdAt')}>
                                    {getSortIcon('createdAt')}
                                </span>
                            </th>
                            <th className="px-5 py-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {task.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b border-green-200 hover:bg-green-50 transition duration-150"
                            >
                                <td className="px-5 py-3 border border-black-300 border-dotted text-center">{item.id}</td>
                                <td className="px-5 py-3 border border-black-300 border-dotted text-left">{item.description}</td>
                                <td className="px-5 py-3 border border-black-300 border-dotted text-center">
                                    <div className="relative">
                                        <select
                                            value={item.status}
                                            onChange={(e) => updateTaskStatus(item.id, e.target.value)}
                                            disabled={taskLoadingStates[item.id]}
                                            className={`w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200 ${
                                                taskLoadingStates[item.id]
                                                    ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                                                    : 'bg-white hover:cursor-pointer text-black'
                                            } ${
                                                taskErrors[item.id]
                                                    ? 'border-red-500'
                                                    : 'border-green-300'
                                            }`}
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status} value={status}>
                                                    {status.replace('-', ' ').toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        {taskLoadingStates[item.id] && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                                            </div>
                                        )}
                                        
                                        {taskErrors[item.id] && (
                                            <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 shadow-sm z-10 min-w-max">
                                                {taskErrors[item.id]}
                                                <button
                                                    onClick={() => setTaskErrors(prev => ({ ...prev, [item.id]: '' }))}
                                                    className="ml-2 text-red-800 hover:text-red-900 font-bold"
                                                    title="Dismiss error"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3 border border-black-300 border-dotted text-center">
                                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    })}
                                </td>
                                <td className="px-5 py-3 border border-black-300 border-dotted text-center">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => editTask(item)}
                                            disabled={taskLoadingStates[item.id]}
                                            className={`px-4 py-2 rounded-md transition duration-200 ${
                                                taskLoadingStates[item.id]
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-yellow-200 text-black hover:bg-yellow-400 hover:cursor-pointer'
                                            }`}
                                        >
                                            {taskLoadingStates[item.id] ? 'Editing...' : 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => deleteTask(item.id)}
                                            disabled={taskLoadingStates[item.id]}
                                            className={`px-4 py-2 rounded-md transition duration-200 ${
                                                taskLoadingStates[item.id]
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-red-200 text-black hover:bg-red-400 hover:cursor-pointer'
                                            }`}
                                        >
                                            {taskLoadingStates[item.id] ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                    {taskErrors[item.id] && (
                                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                            {taskErrors[item.id]}
                                            <button
                                                onClick={() => setTaskErrors(prev => ({ ...prev, [item.id]: '' }))}
                                                className="ml-2 text-red-800 hover:text-red-900 font-bold"
                                                title="Dismiss error"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between w-3/4 mt-4 bg-white p-4 rounded-lg shadow-md">
                    <div className="text-black">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} tasks
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={!pagination.hasPreviousPage}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                        >
                            First
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                        >
                            Previous
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const startPage = Math.max(1, pagination.currentPage - 2);
                                const pageNumber = startPage + i;
                                if (pageNumber > pagination.totalPages) return null;
                                
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => handlePageChange(pageNumber)}
                                        className={`px-3 py-1 rounded-md transition duration-200 ${
                                            pageNumber === pagination.currentPage
                                                ? 'bg-green-600 text-white'
                                                : 'bg-green-200 text-black hover:bg-green-300'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                        >
                            Last
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}