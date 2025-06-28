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

export default function taskPage() {
    const statusOptions = ['pending', 'in-progress', 'completed'];

    

    const filterStatusOptions = ['all', ...statusOptions];
    const [filterStatus, setFilterStatus] = useState('all');

    const [allTasks, setAllTasks] = useState<Task[]>([]);

    const [inputValue, setInputValue] = useState('');
    const [task,setTask] = useState<Task[]>([]);
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState<{
        key: 'id' | 'description' | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    
    useEffect(() => {
        const fetchTasks = async () => {
            const response = await fetch('/api/actions',
            {
                headers:{
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
            });
            if (!response.ok) {
                console.error('Failed to fetch tasks');
                return;
            }
            const data = await response.json();
            setAllTasks(data);
        };
        fetchTasks();
    }, []);


    useEffect(() => {
        if (filterStatus === 'all') {
            setTask(allTasks);
        }
        else {
            setTask(allTasks.filter(item => item.status === filterStatus));
        }
    }, [filterStatus, allTasks]);

    const deleteTask = async (id: number) => {
        // console.log(`Deleting task with ID: ${id}`);
        
        const res = await fetch(`/api/actions/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        const response = await res.json();
        if (!res.ok) {
            console.error('Failed to delete task:', response.error);
            return;
        }
        // Update both arrays
        setTask(prevTasks => prevTasks.filter((item , i) => item.id !== id));
        setAllTasks(prevTasks => prevTasks.filter((item , i) => item.id !== id));
    };

    const addTask = () => {
        const taskInput = (document.getElementById('taskinput') as HTMLInputElement)!.value;
        if (!taskInput.trim()) {
            alert('Please enter a task');
            return;
        }
        const newTask = {
            description: taskInput,
        };
        const res = fetch('/api/actions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(newTask),
        });
        res.then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to add task:', errorData.error);
                return;
            }
            const data = await response.json();
            // Update both allTasks and task arrays
            setAllTasks(prevTasks => [...prevTasks, ...data]);
            // Only add to filtered tasks if it matches current filter
            if (filterStatus === 'all' || data[0].status === filterStatus) {
                setTask(prevTasks => [...prevTasks, ...data]);
            }
        }).catch(error => {
            console.error('Error adding task:', error);
        });
        (document.getElementById('taskinput') as HTMLInputElement)!.value = ''; // Clear input field

    };


    const editTask = (task: Task) => {
        const newDescription = prompt('Edit task description:', task.description);
        if (newDescription === null || newDescription.trim() === '') {
            alert('Task description cannot be empty');
            return; // User cancelled or entered an empty description
        }

        // console.log(`Editing task with ID: ${task.id}, new description: ${newDescription}`);
        if (newDescription === task.description) {
            return; // No changes made
        }
        
        const updatedTask = {
            ...task,
            description: newDescription,
        };

        
        fetch(`/api/actions/${task.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(updatedTask),
        })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to update task:', errorData.error);
                return;
            }
            // Update both arrays
            setTask(prevTasks => prevTasks.map(item => item.id === task.id ? updatedTask : item));
            setAllTasks(prevTasks => prevTasks.map(item => item.id === task.id ? updatedTask : item));
        })
        .catch(error => {
            console.error('Error updating task:', error);
        });
    };

    const updateTaskStatus = (taskId: number, status: string) => {
        if (!statusOptions.includes(status)) {
            alert('Invalid status: '+ status);
            return;
        }
        
        // Find the current task to get its old status for rollback
        const currentTask = task.find(t => t.id === taskId);
        const oldStatus = currentTask?.status || 'pending';
        
        // Optimistically update the UI
        setTask(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status } : item));
        setAllTasks(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status } : item));
        
        fetch(`/api/actions/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ status }),
        })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to update task status:', errorData.error);
                // Rollback on error
                setTask(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status: oldStatus } : item));
                setAllTasks(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status: oldStatus } : item));
                return;
            }
            const updatedTask = await response.json();
            // Confirm the update with server response
            setTask(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status: updatedTask[0].status } : item));
            setAllTasks(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status: updatedTask[0].status } : item));
        })
        .catch(error => {
            // Rollback on error
            setTask(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status: oldStatus } : item));
            setAllTasks(prevTasks => prevTasks.map(item => item.id === taskId ? { ...item, status: oldStatus } : item));
            console.error('Error updating task status:', error);
            alert('Error updating task status: ' + error.message);
        });
    }

    const handleSort = (key: 'id' | 'description') => {
        let direction: 'asc' | 'desc' = 'asc';
        
        // If clicking the same column, toggle direction
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        setSortConfig({ key, direction });
        
        const sortedTasks = [...task].sort((a, b) => {
            if (key === 'id') {
                return direction === 'asc' ? a.id - b.id : b.id - a.id;
            } else if (key === 'description') {
                return direction === 'asc'
                    ? a.description.localeCompare(b.description)
                    : b.description.localeCompare(a.description);
            }
            return 0;
        });
        
        setTask(sortedTasks);
    };

    const getSortIcon = (columnKey: 'id' | 'description') => {
        if (sortConfig.key !== columnKey) {
            return <LuArrowDownUp className="inline ml-2 hover:cursor-pointer" />;
        }
        
        return sortConfig.direction === 'asc'
            ? <LuArrowDownUp className="inline ml-2 hover:cursor-pointer text-green-600" />
            : <LuArrowDownUp className="inline ml-2 hover:cursor-pointer text-green-600 rotate-180" />;
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
    >
      Add Task
    </button>
    <div className="flex justify-right gap-2">
        <label className="flex">
            <FaFilter />
            <select
                value={filterStatus}
                onChange={(e) => {
                    setFilterStatus(e.target.value);
                }}
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
  </div>

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
            <th  className="px-5 py-3 text-center ">
                Task ID
                <span onClick={() => handleSort('id')}>
                    {getSortIcon('id')}
                </span>
            </th>
          <th  className="px-5 py-3  text-center">
            Task Description
            <span onClick={() => handleSort('description')}>
                {getSortIcon('description')}
            </span>
          </th>
          <th>
            Status
          </th>
            <th className="px-5 py-3 text-center">Created At</th>
          <th className="px-5 py-3 text-center" >Actions</th>
        </tr>
      </thead>

      <tbody>
        {task.map((item) => (
          <tr
            key={item.id}
            className="border-b border-green-200 hover:bg-green-50 transition duration-150"
          >
            <td className="px-5 py-3  border border-black-300 border-dotted text-center">{item.id}</td>
            <td className="px-5 py-3  border border-black-300 border-dotted text-left">{item.description}</td>
            <td className="px-5 py-3  border border-black-300 border-dotted text-center">
              <select
                value={item.status}
                onChange={(e) => updateTaskStatus(item.id, e.target.value)}
                className="w-full px-4 py-2 border border-green-300 bg-white text-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200 hover:cursor-pointer"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-5 py-3  border border-black-300 border-dotted text-center">
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
                  className="px-4 py-2 bg-yellow-200 text-black rounded-md hover:bg-yellow-400 transition duration-200 hover:cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(item.id)}
                  className="px-4 py-2 bg-red-200 text-black rounded-md hover:bg-red-400 transition duration-200 hover:cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


    )
}