import profileImage from '../assets/profileImage.jpg';

function AdminProfile() {
    return (
        <div className="min-h-screen bg-white-500">
            <main className="flex flex-col items-center py-8">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-6xl w-full">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center mb-8">
                        <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full border-4 border-purple-main mb-4 shadow-md object-cover" />
                        <article className="text-center text-purple-main max-w-4xl">
                            <h2 className="text-3xl font-bold text-purple-main mb-2">WG</h2>
                            <h3 className="text-xl font-semibold text-green-dark mb-2">About me</h3>
                            <p className="text-black-light leading-relaxed">
                                I am a retired Army combat medic. I served two tours in Iraq—the second of which was cut short because of a brain injury.
                                I have a large extended family, and see my Mom pretty much every week (yeh, I'm kind of a mamma's boy).
                                I grew up in Pinellas County, Florida (the St. Petersburg-Clearwater beaches) and now live a little further south in
                                Sarasota. 
                            </p>
                            <br />
                            <p className='text-black-light leading-relaxed'>
                                One of the things I still enjoy is movies. I've watched a bunch of them. This site is where
                                I share my favorites, highlighting the stories and the actors I enjoy the most. I've been
                                told I sometimes have unusual taste in movies and I do tend to watch my favorites
                                multiple times. (C'mon, you can't get too much of a monkey driving a car in Grandma's
                                Boy!) 
                            </p>
                            <br />
                            <p className='text-black-light leading-relaxed'>
                            I hope you enjoy my site and that you'll chime in and leave your comments too.
                        </p>
                    </article>
                    </div>
                </div>
            </main>
            <footer className="text-center py-4 text-secondary-black-light">
                <h3 className="font-semibold">Profile</h3>
            </footer>
        </div>
    )
}

export default AdminProfile;