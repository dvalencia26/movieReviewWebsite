import { X } from "lucide-react";

const Modal = ({isOpen, onClose, children}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 relative animate-fade-in-bounce">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover-scale"
                    >
                        <X size={20} />
                    </button>
                    
                    {/* Modal Body */}
                    <div className="pt-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;