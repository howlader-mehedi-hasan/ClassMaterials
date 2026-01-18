import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Lock, Save, Loader2, Upload, Check, FileText, RefreshCw, Trash, HardDrive, Layout, Calendar, Users, UserPlus, Key, LogOut, Shield, Eye, EyeOff, Copy, X, Inbox, Mail, AlertCircle, MessageSquare, Star, Pencil } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AdminDashboard() {
    const { user, isAdmin, login, logout } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab) {
            setActiveTab(tab);
        }
    }, [location]);

    // Login State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Global Settings State
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [visibleDays, setVisibleDays] = useState([]);
    const [defaultScheduleView, setDefaultScheduleView] = useState("classic");
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState(null);

    // ... (User Management State)

    // ...

    const fetchSettings = async () => {
        try {
            const response = await fetch("http://localhost:3001/api/settings");
            if (response.ok) {
                const data = await response.json();
                setWelcomeMessage(data.welcomeMessage || "");
                setVisibleDays(data.visibleDays || []);
                setDefaultScheduleView(data.defaultScheduleView || "classic");
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    // ...

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSettingsLoading(true);
        setSettingsMessage(null);

        try {
            const response = await fetch("http://localhost:3001/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    welcomeMessage,
                    visibleDays,
                    defaultScheduleView
                }),
            });

            if (response.ok) {
                setSettingsMessage({ type: "success", text: "Settings saved successfully!" });
            } else {
                throw new Error("Failed to save settings");
            }
        } catch (error) {
            setSettingsMessage({ type: "error", text: error.message });
        } finally {
            setSettingsLoading(false);
        }
    };


    // User Management State
    const [users, setUsers] = useState([]);
    const [newUserUsername, setNewUserUsername] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState("editor");
    const [newPermissions, setNewPermissions] = useState({
        courses_edit: false,
        syllabus_edit: false,
        schedule_edit: false,
        homepage_edit: false,
        exams_edit: false,
        course_materials_edit: false
    });
    const [userMessage, setUserMessage] = useState(null);

    // Permissions Modal State
    const [permissionsModalUser, setPermissionsModalUser] = useState(null);
    const [permissionsToEdit, setPermissionsToEdit] = useState(null);

    // Profile State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newProfilePassword, setNewProfilePassword] = useState("");
    const [profileMessage, setProfileMessage] = useState(null);

    // System Maintenance State
    const [cleaning, setCleaning] = useState(false);

    // Deletion Requests State
    const [deletionRequests, setDeletionRequests] = useState([]);

    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // User Editing State
    const [editingUser, setEditingUser] = useState(null);
    const [editUserForm, setEditUserForm] = useState({ name: "", username: "", password: "" });

    // Messages State
    const [messages, setMessages] = useState([]);

    // Complaints State
    const [complaints, setComplaints] = useState([]);

    // Opinions State
    const [opinions, setOpinions] = useState([]);
    const [editingOpinion, setEditingOpinion] = useState(null);
    const [editForm, setEditForm] = useState({ rating: 0, feedback: "", date: "" });

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        if (user) {
            fetchSettings();
            if (isAdmin) {
                fetchUsers();
                fetchDeletionRequests();
                fetchAuditLogs();
                fetchAuditLogs();
                fetchMessages();
                fetchComplaints();
                fetchOpinions();
            }
        }
    }, [user, isAdmin]);

    const fetchDeletionRequests = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/admin/deletion-requests");
            if (res.ok) setDeletionRequests(await res.json());
        } catch (error) {
            console.error("Failed to fetch requests", error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/admin/logs");
            if (res.ok) setAuditLogs(await res.json());
        } catch (error) {
            console.error("Failed to fetch logs", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/admin/messages");
            if (res.ok) setMessages(await res.json());
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const fetchComplaints = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/admin/complaints");
            if (res.ok) setComplaints(await res.json());
        } catch (error) {
            console.error("Failed to fetch complaints", error);
        }
    };

    const fetchOpinions = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/opinions");
            if (res.ok) setOpinions(await res.json());
        } catch (error) {
            console.error("Failed to fetch opinions", error);
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!window.confirm("Delete this message permanently?")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/admin/messages/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchMessages();
            } else {
                alert("Failed to delete message");
            }
        } catch (error) {
            console.error("Error deleting message", error);
        }
    };

    const handleDeleteComplaint = async (id) => {
        if (!window.confirm("Delete this complaint permanently?")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/admin/complaints/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchComplaints();
            } else {
                alert("Failed to delete complaint");
            }
        } catch (error) {
            console.error("Error deleting complaint", error);
        }
    };

    const handleDeleteOpinion = async (id) => {
        if (!window.confirm("Delete this feedback?")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/admin/opinions/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchOpinions();
            } else {
                alert("Failed to delete feedback");
            }
        } catch (error) {
            console.error("Error deleting feedback", error);
        }
    };


    const handleEditOpinion = (op) => {
        setEditingOpinion(op);
        setEditForm({ rating: op.rating, feedback: op.feedback, date: op.date });
    };

    const saveOpinion = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/admin/opinions/${editingOpinion.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setEditingOpinion(null);
                fetchOpinions();
            } else {
                alert("Failed to update feedback");
            }
        } catch (error) {
            console.error("Error updating feedback", error);
        }
    };

    const handleApproveRequest = async (id) => {
        if (!window.confirm("Approve this deletion? This item will be permanently deleted.")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/admin/deletion-requests/${id}/approve`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchDeletionRequests();
            } else {
                alert("Failed: " + data.error);
            }
        } catch (error) {
            alert("Error approving request");
        }
    };

    const handleRejectRequest = async (id) => {
        if (!window.confirm("Reject this request?")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/admin/deletion-requests/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchDeletionRequests();
            }
        } catch (error) {
            alert("Error rejecting request");
        }
    };



    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:3001/api/users");
            if (response.ok) {
                setUsers(await response.json());
            }
        } catch (error) {
            console.error("Failed to fetch users");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        const result = await login(username, password);
        if (!result.success) {
            setLoginError(result.error || "Login failed");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3001/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: newUserUsername,
                    password: newUserPassword,
                    name: newName,
                    role: newRole,
                    permissions: newRole === 'admin' ? null : newPermissions
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setUserMessage({ type: "success", text: "User created successfully!" });
                setNewUserUsername("");
                setNewUserPassword("");
                setNewName("");
                setNewPermissions({
                    courses_edit: false,
                    syllabus_edit: false,
                    schedule_edit: false,
                    notices_edit: false,
                    homepage_edit: false,
                    exams_edit: false
                });
                fetchUsers();
            } else {
                setUserMessage({ type: "error", text: data.error });
            }
        } catch (error) {
            setUserMessage({ type: "error", text: "Failed to create user" });
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditUserForm({ name: user.name, username: user.username, password: user.password });
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editUserForm)
            });

            if (res.ok) {
                setEditingUser(null);
                fetchUsers();
                setUserMessage({ type: "success", text: "User updated successfully" });
                setTimeout(() => setUserMessage(null), 3000);
            } else {
                const data = await res.json();
                setUserMessage({ type: "error", text: data.error || "Failed to update user" });
            }
        } catch (error) {
            console.error("Error updating user", error);
            setUserMessage({ type: "error", text: "Failed to update user" });
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        try {
            const response = await fetch(`http://localhost:3001/api/users/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchUsers();
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        // Ideally verify current password first, but for MVP just update
        try {
            const response = await fetch(`http://localhost:3001/api/users/${user.id}/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: newProfilePassword }),
            });
            if (response.ok) {
                setProfileMessage({ type: "success", text: "Password updated successfully" });
                setNewProfilePassword("");
            } else {
                setProfileMessage({ type: "error", text: "Failed to update password" });
            }
        } catch (error) {
            setProfileMessage({ type: "error", text: "Error updating password" });
        }
    };

    const copyCredentials = (u) => {
        const text = `${u.username}\t${u.password}`;
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied credentials for ${u.name}`);
        });
    };

    const handlePermissionsClick = (user) => {
        setPermissionsModalUser(user);
        setPermissionsToEdit(user.permissions || {
            courses_edit: false,
            syllabus_edit: false,
            schedule_edit: false,
            notices_edit: false,
            homepage_edit: false,
            exams_edit: false
        });
    };

    const handlePermissionsSave = async () => {
        if (!permissionsModalUser) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/${permissionsModalUser.id}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: permissionsToEdit })
            });
            if (res.ok) {
                alert("Permissions updated successfully!");
                setPermissionsModalUser(null);
                fetchUsers();
            } else {
                alert("Failed to update permissions.");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating permissions.");
        }
    };




    const toggleDay = (day) => {
        setVisibleDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleCleanup = async () => {
        if (!window.confirm("Are you sure? This will delete orphaned files from the server. This cannot be undone.")) return;

        setCleaning(true);
        try {
            const res = await fetch('http://localhost:3001/api/cleanup', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
            } else {
                alert('Cleanup failed: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Cleanup failed');
        } finally {
            setCleaning(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center mt-20 px-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border border-gray-100 dark:border-slate-700 transition-colors">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Admin Access</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to manage the system.</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        />
                        <PasswordInput
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Welcome back, {user.name} ({user.role})</p>
                </div>

            </div>

            {/* Top Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link to="/courses" className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Manage Course Materials</h2>
                        <p className="text-blue-100">Add, edit, or delete courses.</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                        <FileText className="w-8 h-8" />
                    </div>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white dark:bg-slate-800 p-1 rounded-xl mb-8 shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
                {(isAdmin || user?.permissions?.homepage_edit || user?.permissions?.schedule_edit) && (
                    <TabButton id="settings" icon={Layout} label="Global Settings" active={activeTab} onClick={setActiveTab} />
                )}
                {isAdmin && <TabButton id="users" icon={Users} label="User Management" active={activeTab} onClick={setActiveTab} />}
                <TabButton id="profile" icon={Key} label="My Profile" active={activeTab} onClick={setActiveTab} />
                {isAdmin && <TabButton id="requests" icon={Inbox} label="Deletion Requests" active={activeTab} onClick={setActiveTab} />}
                {isAdmin && <TabButton id="messages" icon={Mail} label="Messages" active={activeTab} onClick={setActiveTab} />}
                {isAdmin && <TabButton id="complaints" icon={AlertCircle} label="Complaints" active={activeTab} onClick={setActiveTab} />}
                {isAdmin && <TabButton id="opinions" icon={MessageSquare} label="Feedback" active={activeTab} onClick={setActiveTab} />}
                {isAdmin && <TabButton id="logs" icon={FileText} label="Activity Logs" active={activeTab} onClick={setActiveTab} />}
                {isAdmin && <TabButton id="system" icon={HardDrive} label="System" active={activeTab} onClick={setActiveTab} />}
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">

                {/* GLOBAL SETTINGS */}
                {activeTab === "settings" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Site Configuration</h2>
                            {settingsMessage && (
                                <div className={`p-4 rounded-lg mb-6 ${settingsMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                    {settingsMessage.text}
                                </div>
                            )}

                            {/* Welcome Message Section - Protected */}
                            {(isAdmin || user?.permissions?.homepage_edit) ? (
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Welcome Message</label>
                                        <input
                                            type="text"
                                            value={welcomeMessage}
                                            onChange={(e) => setWelcomeMessage(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button type="submit" disabled={settingsLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg flex justify-center items-center">
                                        {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Settings
                                    </button>
                                </form>
                            ) : (
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-gray-500 text-sm italic">
                                    You do not have permission to edit the welcome message.
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Schedule Visibility</h2>
                            {/* Schedule Settings Section - Protected */}
                            {(isAdmin || user?.permissions?.schedule_edit) ? (
                                <div className="space-y-3">
                                    {daysOfWeek.map(day => (
                                        <label key={day} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={visibleDays.includes(day)}
                                                onChange={() => toggleDay(day)}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700"
                                            />
                                            <span className={`font-medium ${visibleDays.includes(day) ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{day}</span>
                                        </label>
                                    ))}
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={settingsLoading}
                                        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg flex justify-center items-center md:hidden"
                                    >
                                        {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Visibility
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-gray-500 text-sm italic">
                                    You do not have permission to edit schedule visibility.
                                </div>
                            )}

                            {/* Default Schedule View - Protected */}
                            {(isAdmin || user?.permissions?.schedule_edit) && (
                                <div className="mt-8 border-t border-gray-100 dark:border-slate-700 pt-6">
                                    <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Default View Mode</h3>
                                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-4">
                                        <div className="flex bg-gray-200 dark:bg-slate-700 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setDefaultScheduleView("classic")}
                                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${defaultScheduleView === 'classic' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                            >
                                                Classic (Cards)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDefaultScheduleView("precision")}
                                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${defaultScheduleView === 'precision' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                            >
                                                Precision (Timeline)
                                            </button>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleSaveSettings}
                                                disabled={settingsLoading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
                                            >
                                                Save Preference
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                                        This sets the default view for all users when they first load the schedule.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* USER MANAGEMENT */}
                {activeTab === "users" && isAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Existing Users</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400">
                                            <th className="py-3 px-4">Name</th>
                                            <th className="py-3 px-4">Username</th>
                                            <th className="py-3 px-4">Password</th>
                                            <th className="py-3 px-4">Role</th>
                                            <th className="py-3 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <td className="py-3 px-4 text-gray-800 dark:text-white font-medium">{u.name}</td>
                                                <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{u.username}</td>
                                                <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">{u.password || '••••••'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 flex items-center space-x-2">
                                                    <button onClick={() => handleEditUser(u)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit User">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => copyCredentials(u)} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50" title="Copy Credentials">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete User">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                    {u.role !== 'admin' && (
                                                        <button onClick={() => handlePermissionsClick(u)} className="text-purple-500 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20" title="Manage Permissions">
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Add New User</h2>
                            {userMessage && (
                                <div className={`p-4 rounded-lg mb-6 ${userMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                    {userMessage.text}
                                </div>
                            )}
                            <form onSubmit={handleCreateUser} className="space-y-4 bg-gray-50 dark:bg-slate-700/30 p-6 rounded-xl border border-gray-100 dark:border-slate-700">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={newUserUsername}
                                    onChange={(e) => setNewUserUsername(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                                />
                                <PasswordInput
                                    placeholder="Password"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                                />
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none"
                                >
                                    <option value="editor">Editor (Manage Courses)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Create User</button>

                                {newRole === 'editor' && (
                                    <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                            <Shield className="w-4 h-4 mr-2" />
                                            Permissions
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={newPermissions.courses_edit}
                                                    onChange={e => setNewPermissions({ ...newPermissions, courses_edit: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Edit Courses (CRUD)</span>
                                            </label>
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={newPermissions.exams_edit}
                                                    onChange={e => setNewPermissions({ ...newPermissions, exams_edit: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Edit Exams (Up Next)</span>
                                            </label>
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={newPermissions.syllabus_edit}
                                                    onChange={e => setNewPermissions({ ...newPermissions, syllabus_edit: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Edit Syllabus</span>
                                            </label>
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={newPermissions.schedule_edit}
                                                    onChange={e => setNewPermissions({ ...newPermissions, schedule_edit: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Edit Schedule</span>
                                            </label>
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={newPermissions.homepage_edit}
                                                    onChange={e => setNewPermissions({ ...newPermissions, homepage_edit: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Edit Welcome Message</span>
                                            </label>
                                            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={newPermissions.course_materials_edit}
                                                    onChange={e => setNewPermissions({ ...newPermissions, course_materials_edit: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>Manage Course Materials (Files Only)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* PROFILE */}
                {activeTab === "profile" && (
                    <div className="max-w-md mx-auto">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white text-center">Change Password</h2>
                        {profileMessage && (
                            <div className={`p-4 rounded-lg mb-6 ${profileMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                {profileMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <PasswordInput
                                placeholder="New Password"
                                value={newProfilePassword}
                                onChange={(e) => setNewProfilePassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg">Update Password</button>
                        </form>
                    </div>
                )}

                {/* SYSTEM */}
                {activeTab === "system" && isAdmin && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                            <HardDrive className="w-5 h-5 mr-2 text-orange-500" />
                            System Maintenance
                        </h2>
                        <div className="flex items-center justify-between p-6 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Clear Junk Files</h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-lg">
                                    Scans your storage for files that are no longer linked to any course or notice. Use this to free up disk space.
                                </p>
                            </div>
                            <button
                                onClick={handleCleanup}
                                disabled={cleaning}
                                className="flex items-center px-6 py-3 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {cleaning ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Trash className="w-5 h-5 mr-2" />}
                                {cleaning ? 'Cleaning...' : 'Clear Junk'}
                            </button>
                        </div>
                    </div>
                )}

                {/* DELETION REQUESTS */}
                {activeTab === "requests" && isAdmin && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <Inbox className="w-5 h-5 mr-2 text-purple-500" />
                                Deletion Requests
                            </h2>
                            <button
                                onClick={fetchDeletionRequests}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                            </button>
                        </div>

                        {deletionRequests.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                <p className="text-gray-500 dark:text-gray-400">No pending deletion requests.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-sm">
                                        <tr>
                                            <th className="py-3 px-4">Type</th>
                                            <th className="py-3 px-4">Details</th>
                                            <th className="py-3 px-4">Requested By</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {deletionRequests.map(req => (
                                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className={`uppercase text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300`}>
                                                        {req.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {req.type === 'file' ? req.resourceId : (req.details?.name || req.details?.title || req.resourceId)}
                                                    </div>
                                                    {req.details && (
                                                        <div className="text-xs text-gray-500">
                                                            {req.type === 'file' && `in ${req.details.courseId}`}
                                                            {req.type === 'exam' && `in ${req.details.courseId}`}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {req.requestedBy}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">
                                                    {new Date(req.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleApproveRequest(req.id)}
                                                        className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(req.id)}
                                                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* MESSAGES TAB */}
                {activeTab === "messages" && isAdmin && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Inbox ({messages.length})</h2>
                            <button onClick={fetchMessages} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No messages found</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl border border-gray-100 dark:border-slate-700 transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{msg.subject}</h3>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">{msg.name}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>{msg.email}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>{new Date(msg.date).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Delete Message"
                                            >
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-100 dark:border-slate-600">
                                            {msg.message}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* COMPLAINTS TAB */}
                {activeTab === "complaints" && isAdmin && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Complaints ({complaints.length})</h2>
                            <button onClick={fetchComplaints} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {complaints.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No complaints found</p>
                                </div>
                            ) : (
                                complaints.map(comp => (
                                    <div key={comp.id} className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl border border-gray-100 dark:border-slate-700 transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{comp.subject}</h3>
                                                    {comp.anonymous && (
                                                        <span className="px-2 py-1 bg-gray-200 dark:bg-slate-600 text-xs rounded-md text-gray-600 dark:text-gray-300 font-medium">Anonymous</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                    <span className="font-medium text-red-600 dark:text-red-400">{comp.department}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>{new Date(comp.date).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteComplaint(comp.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Delete Complaint"
                                            >
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-100 dark:border-slate-600">
                                            {comp.description}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* OPINIONS TAB */}
                {activeTab === "opinions" && isAdmin && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Student Feedback ({opinions.length})</h2>
                            <button onClick={fetchOpinions} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {opinions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No feedback found</p>
                                </div>
                            ) : (
                                opinions.map(op => (
                                    <div key={op.id} className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl border border-gray-100 dark:border-slate-700 transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center space-x-1 mb-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < op.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-slate-600"}`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>Anonymous</span> • <span>{op.date}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditOpinion(op)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Edit Feedback"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOpinion(op.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete Feedback"
                                                >
                                                    <Trash className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-100 dark:border-slate-600">
                                            "{op.feedback}"
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "logs" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Activity Logs</h2>
                            <button onClick={fetchAuditLogs} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-900/50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {auditLogs.filter(log =>
                                            log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            log.details.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(log.date).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {log.username}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                                        ${log.action.includes('DELETE') ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                            log.action.includes('CREATE') ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {log.details}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Permissions Modal */}
            {permissionsModalUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Permissions: {permissionsModalUser.name}</h3>
                            <button onClick={() => setPermissionsModalUser(null)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.courses_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, courses_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Edit Courses</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.exams_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, exams_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Edit Exams (Up Next)</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.syllabus_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, syllabus_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Edit Syllabus</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.notices_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, notices_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Manage Notices</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.schedule_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, schedule_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Edit Schedule</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.homepage_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, homepage_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Edit Welcome Message</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissionsToEdit.course_materials_edit}
                                        onChange={e => setPermissionsToEdit({ ...permissionsToEdit, course_materials_edit: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">Manage Course Materials (Files Only)</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end space-x-3 bg-gray-50 dark:bg-slate-900/50">
                            <button onClick={() => setPermissionsModalUser(null)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">Cancel</button>
                            <button onClick={handlePermissionsSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    value={editUserForm.name}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    value={editUserForm.username}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password (Visible)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-mono"
                                    value={editUserForm.password}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                                    ⚠️ Changing username or password will require the user to log in again with new credentials.
                                </p>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Opinion Modal */}
            {editingOpinion && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Feedback</h2>
                            <button onClick={() => setEditingOpinion(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={saveOpinion} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, rating: star })}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-colors ${star <= editForm.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300 dark:text-slate-600"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    rows="5"
                                    value={editForm.feedback}
                                    onChange={(e) => setEditForm({ ...editForm, feedback: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingOpinion(null)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function PasswordInput({ value, onChange, placeholder, required = false, className }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative w-full">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={className}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
    );
}

function TabButton({ id, icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${active === id
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
