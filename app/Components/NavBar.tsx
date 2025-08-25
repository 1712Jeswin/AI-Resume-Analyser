import React from 'react'
import { Link, useNavigate } from 'react-router'
import { usePuterStore } from "~/lib/puter";

const NavBar = () => {
  const { auth } = usePuterStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Error: ",e)
    } finally {
      navigate('/auth');
    }
  };

  return (
    <nav className='navbar'>
      <Link to='/'>
        <p className='text-2xl font-bold text-gradient'>RESUMIND</p>
      </Link>
      <div className='flex flex-row items-center gap-2'>
        <Link to='/upload' className='primary-button w-fit'>Upload Resume</Link>
        {auth.isAuthenticated && (
          <button onClick={handleLogout} className='primary-gradient text-white rounded-full px-4 py-2 cursor-pointer w-fit'>Logout</button>
        )}
      </div>
    </nav>
  )
}

export default NavBar