import React, { useState } from "react";
import { CheckCircle, Circle, Clock, AlertCircle, Plus, X } from "lucide-react";

const WhatToDoList = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Complete Module 3 of Data Structures", due: "Today", priority: "high", completed: false },
    { id: 2, title: "Attend AI Live Session", due: "Tomorrow", priority: "medium", completed: false },
    { id: 3, title: "Download Web Dev Certificate", due: "This Week", priority: "low", completed: false },
    { id: 4, title: "Take Quiz: Machine Learning", due: "Friday", priority: "high", completed: false },
    { id: 5, title: "Review Python Fundamentals", due: "Next Week", priority: "medium", completed: false },
  ]);
  const [newTask, setNewTask] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "high": return { color: "text-red-500", icon: <AlertCircle className="w-4 h-4 text-red-500" />, badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
      case "medium": return { color: "text-yellow-500", icon: <Clock className="w-4 h-4 text-yellow-500" />, badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
      case "low": return { color: "text-green-500", icon: <Circle className="w-4 h-4 text-green-500" />, badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
      default: return { color: "text-gray-500", icon: <Circle className="w-4 h-4 text-gray-500" />, badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = { id: Date.now(), title: newTask, due: "This Week", priority: "medium", completed: false };
    setTasks([...tasks, task]);
    setNewTask("");
    setShowAddForm(false);
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const filteredTasks = tasks.filter(t =>
    filter === "completed" ? t.completed : filter === "pending" ? !t.completed : true
  );

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">What to Do</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {completedCount}/{totalCount} done
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-3 py-2 text-sm text-white rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${(completedCount / totalCount) * 100 || 0}%` }}
        ></div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {["all", "pending", "completed"].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-1.5 text-xs rounded-full capitalize font-medium transition-all ${
              filter === type
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl animate-fadeIn">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add new task..."
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button onClick={addTask} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all">
              Add
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {filteredTasks.map((task) => {
          const { color, icon, badge } = getPriorityStyles(task.priority);
          return (
            <li
              key={task.id}
              className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all shadow-sm hover:shadow-md ${
                task.completed
                  ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-blue-500" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-green-700 dark:text-green-300" : "text-gray-800 dark:text-gray-200"}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${badge}`}>{task.priority}</span>
                  <span className={`text-xs ${color}`}>{task.due}</span>
                  {icon}
                </div>
              </div>

              <button onClick={() => deleteTask(task.id)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <X className="w-4 h-4 text-red-500" />
              </button>
            </li>
          );
        })}
      </ul>

      {filteredTasks.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm italic animate-fadeIn">
          {filter === "all" ? "No tasks yet!" : filter === "completed" ? "No completed tasks yet." : "All tasks are done!"}
        </div>
      )}
    </div>
  );
};

export default WhatToDoList;
