import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import Chats from './pages/Chats'
import ProtectedRoute from './components/ProtectedRoute'
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import UserProfile from './components/UserProfile'

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function App() {
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          
          <Route path='/chats' 
            element={
              <ProtectedRoute>  
                <Chats /> 
              </ProtectedRoute>
            }/>
          <Route path='/profile' 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }/>
          
          <Route path='/' element={<Home />}/>
          <Route path='/login' element={<Login />}/>
          <Route path='/register' element={<Register />}/>
          <Route path='/logout' element={<Logout />}/>
          <Route path='*' element={<NotFound />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App