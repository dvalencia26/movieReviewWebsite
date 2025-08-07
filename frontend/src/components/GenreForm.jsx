import { Plus, Trash2 } from "lucide-react";

const GenreForm = ({value, setValue, handleSubmit, buttonText = 'Add Genre', handleDelete}) => {
    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Field */}
                <div>
                    <label htmlFor="genreName" className="block text-sm font-medium text-white/90 mb-2">
                        Genre Name
                    </label>
                    <input 
                        type="text"
                        id="genreName"
                        placeholder="Enter genre name"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-main focus:border-transparent transition-all"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                    />
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3">
                    <button 
                        type="submit" 
                        className="flex items-center space-x-2 bg-green-main hover:bg-green-dark text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover-scale focus:outline-none focus:ring-2 focus:ring-green-light flex-1"
                    >
                        <Plus size={18} />
                        <span>{buttonText}</span>
                    </button>
                    
                    {handleDelete && (
                        <button 
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover-scale focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                            <Trash2 size={18} />
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default GenreForm;