const PrimaryCard = ({ title, value, icon: Icon, iconColor, bgColor }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
                    <div className="text-3xl font-bold text-gray-900">
                        {value?.toLocaleString() || '0'}
                    </div>
                </div>
                <div className={`w-14 h-14 ${bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`${iconColor}`} size={28} />
                </div>
            </div>
        </div>
    );
};

export default PrimaryCard;