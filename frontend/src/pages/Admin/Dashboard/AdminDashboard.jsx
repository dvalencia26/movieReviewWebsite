import Sidebar from "./Sidebar/Sidebar";
import Main from "./Main/Main";

const AdminDashboard = () => {
    return (
        <div className="min-h-screen bg-white-500 pt-16">
            <div className="flex">
                <Sidebar />
                <Main />
            </div>
        </div>
    )
}

export default AdminDashboard;