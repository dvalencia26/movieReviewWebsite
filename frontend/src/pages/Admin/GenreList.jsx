import {useState} from "react";
import { useCreateGenreMutation,
     useUpdateGenreMutation,
     useRemoveGenreMutation,
     useGetAllGenresQuery } from "../../redux/api/genre";

import { toast } from "sonner";
import GenreForm from "../../components/GenreForm";
import Modal from "../../components/Modal";
import { Tags, Settings, Plus } from "lucide-react";

const GenreList = () => {
    const {data: genres, refetch} = useGetAllGenresQuery();
    const [name, setName] = useState("");
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [updatingName, setUpdatingName] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [createGenre] = useCreateGenreMutation();
    const [updateGenre] = useUpdateGenreMutation();
    const [removeGenre] = useRemoveGenreMutation();

    const handleCreateGenre = async (e) => {
        e.preventDefault();
        if (!name){
            toast.error("Genre name is required");
            return;
        }

        try {
            const result =await createGenre({name}).unwrap();

            if (result.error){
                toast.error(result.error);
            } else {
                setName("");
                toast.success(`${result.name} genre created successfully`);
                refetch();
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to create genre, please try again");
        }
    };

    const handleUpdateGenre = async (e) => { 
        e.preventDefault();

        if (!updateGenre){
            toast.error("Genre name is required");
            return;
        }

        try {
            const result = await updateGenre({
                id: selectedGenre._id,
                updateGenre:{
                    name: updatingName,
                }
            }).unwrap();

            if (result.error){
                toast.error(result.error);
            } else {
                toast.success(`${result.name} genre updated successfully`);
                refetch();
                setSelectedGenre(null);
                setUpdatingName("");
                setModalVisible(false);
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to update genre, please try again");
        }
    }

    const handleDeleteGenre = async () => { 
        try {
            const result = await removeGenre(selectedGenre._id).unwrap();

            if (result.error){
                toast.error(result.error);
            } else {
                toast.success(`${result.name} genre deleted successfully`);
                refetch();
                setSelectedGenre(null);
                setUpdatingName("");
                setModalVisible(false);
            }
        } catch (error){
            console.log(error);
            toast.error("Failed to delete genre, please try again");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-main to-purple-dark pt-20 px-4 py-8">
            <div className="container mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <h1 className="text-4xl font-bold text-white">Manage Genres</h1>
                        <Settings className="text-white" size={36} />
                    </div>
                    <p className="text-white/80 text-lg">Create, edit, and organize movie genres</p>
                </div>

                {/* Create Genre Section */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <Plus className="text-green-main" size={24} />
                        <h2 className="text-xl font-semibold text-white">Add New Genre</h2>
                    </div>
                    <GenreForm 
                        value={name} 
                        setValue={setName} 
                        handleSubmit={handleCreateGenre} 
                        buttonText="Add Genre"
                    />
                </div>

                {/* Genres Grid */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                        <Tags className="text-blue-main" size={24} />
                        <span>Existing Genres ({genres?.length || 0})</span>
                    </h2>
                    
                    {genres?.length === 0 ? (
                        <div className="text-center py-12">
                            <Tags className="text-white/40 mx-auto mb-4" size={64} />
                            <p className="text-white/60 text-lg">No genres created yet</p>
                            <p className="text-white/40">Create your first genre above!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {genres?.map((genre) => (
                                <button
                                    key={genre._id}
                                    className="group bg-white/5 hover:bg-white/15 border border-white/20 hover:border-white/40 rounded-xl p-4 transition-all duration-200 hover-scale focus:outline-none focus:ring-2 focus:ring-blue-main"
                                    onClick={() => {
                                        setModalVisible(true);
                                        setSelectedGenre(genre);
                                        setUpdatingName(genre.name);
                                    }}
                                >
                                    <div className="flex items-center justify-center space-x-2 bg-blue-main rounded-lg p-2">
                                        <span className="text-white font-medium group-hover:text-white transition-colors">
                                            {genre.name}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                        Click to edit
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)}>
                <div className="space-y-4">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Edit Genre</h3>
                        <p className="text-white/70">Update or delete this genre</p>
                    </div>
                    
                    <GenreForm 
                        value={updatingName} 
                        setValue={setUpdatingName} 
                        handleSubmit={handleUpdateGenre}
                        buttonText="Update Genre"
                        handleDelete={handleDeleteGenre}
                    />
                </div>
            </Modal>
        </div>
    )
}

export default GenreList;