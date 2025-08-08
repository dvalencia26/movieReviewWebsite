
const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-main/80 to-purple-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        {/* Spinning Loader */}
        <div className="flex flex-col items-center space-y-4">
          {/* Main spinner */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-white/20"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-green-main animate-spin"></div>
          </div>
          
          {/* Loading text */}
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg">Loading...</h3>
            <p className="text-white/70 text-sm mt-1">Please wait a moment</p>
          </div>
          
          {/* Pulsing dots */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-green-main rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-main rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-green-main rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Loader;