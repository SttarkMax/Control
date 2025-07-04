


import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage'; 
import CreateQuotePage from './pages/CreateQuotePage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import OrdersPage from './pages/OrdersPage';
import CashFlowPage from './pages/CashFlowPage';
import CustomersPage from './pages/CustomersPage'; 
import UsersPage from './pages/UsersPage';
import AllQuotesPage from './pages/AllQuotesPage'; 
import UserSalesPerformancePage from './pages/UserSalesPerformancePage';
import SuppliersPage from './pages/SuppliersPage'; // Added for Suppliers
import AccountsPayablePage from './pages/AccountsPayablePage';
import ViewQuoteDetailsModal from './components/ViewQuoteDetailsModal'; 
import { UserAccessLevel, CompanyInfo, Quote, User, LoggedInUser } from './types'; 
import { DEFAULT_USER_ACCESS_LEVEL, USERS_STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [companyDetails, setCompanyDetails] = useState<CompanyInfo | null>(null);
  
  const [selectedQuoteForGlobalView, setSelectedQuoteForGlobalView] = useState<Quote | null>(null);
  const [isViewDetailsModalOpenForGlobal, setIsViewDetailsModalOpenForGlobal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user: LoggedInUser = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }

    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      setCompanyDetails(JSON.parse(savedCompanyInfo));
    }
    
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'companyInfo') {
        if (event.newValue) {
          setCompanyDetails(JSON.parse(event.newValue));
        } else {
          setCompanyDetails(null);
        }
      }
      if (event.key === 'currentUser') { // Keep currentUser state in sync
        if (event.newValue) {
          setCurrentUser(JSON.parse(event.newValue));
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleLogin = (username: string, role: UserAccessLevel) => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const foundUser = storedUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    let userToSet: LoggedInUser;

    if (foundUser) {
      userToSet = {
        id: foundUser.id,
        username: foundUser.username,
        fullName: foundUser.fullName || foundUser.username, 
        role: foundUser.role, // Prioritize role from managed users list
      };
    } else {
      // Fallback for simulated users not in UsersPage list, or first-time admin
      userToSet = {
        id: username, // Use username as ID for simulated/unmanaged users
        username: username,
        fullName: username, // Default fullName to username
        role: role,
      };
    }
    
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(userToSet));
    
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      setCompanyDetails(JSON.parse(savedCompanyInfo));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };
  
  const handleOpenViewDetailsForGlobal = (quote: Quote) => {
    setSelectedQuoteForGlobalView(quote);
    setIsViewDetailsModalOpenForGlobal(true);
  };
  const handleCloseViewDetailsForGlobal = () => {
    setIsViewDetailsModalOpenForGlobal(false);
    setSelectedQuoteForGlobalView(null);
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: UserAccessLevel | UserAccessLevel[] }> = ({ children, requiredRole }) => {
    if (!isAuthenticated || !currentUser) { // Check currentUser as well
      return <Navigate to="/login" replace />;
    }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(currentUser.role)) {
        alert("Você não tem permissão para acessar esta página.");
        return <Navigate to="/" replace />;
      }
    }
    return <>{children}</>;
  };


  if (!isAuthenticated || !currentUser) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-gray-950">
        <Header 
          userName={currentUser.username} 
          userFullName={currentUser.fullName}
          userRole={currentUser.role} 
          onLogout={handleLogout} 
          companyInfo={companyDetails}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex flex-1 pt-16"> 
          <Sidebar currentRole={currentUser.role} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <main className="flex-1 p-4 md:p-6 bg-gray-950 md:ml-64 overflow-y-auto"> 
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardPage 
                    userName={currentUser.fullName || currentUser.username} 
                    userRole={currentUser.role}
                    openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} 
                  />
                </ProtectedRoute>
              } />
              <Route path="/products" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><ProductsPage /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><CategoriesPage /></ProtectedRoute>} /> 
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}>
                    <CustomersPage 
                      openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} 
                    />
                  </ProtectedRoute>
                } 
              /> 
              <Route path="/quotes/new" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><CreateQuotePage currentUser={currentUser} /></ProtectedRoute>} />
              <Route path="/quotes/edit/:quoteId" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><CreateQuotePage currentUser={currentUser} /></ProtectedRoute>} />
              <Route 
                path="/quotes/all" 
                element={
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES, UserAccessLevel.VIEWER]}>
                    <AllQuotesPage openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} />
                  </ProtectedRoute>
                } 
              />
               <Route 
                path="/suppliers" 
                element={
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}>
                    <SuppliersPage />
                  </ProtectedRoute>
                } 
              />
               <Route 
                path="/accounts-payable" 
                element={
                  <ProtectedRoute requiredRole={UserAccessLevel.ADMIN}>
                    <AccountsPayablePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sales/user-performance"
                element={
                  <ProtectedRoute requiredRole={UserAccessLevel.ADMIN}>
                    <UserSalesPerformancePage currentUser={currentUser} />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute requiredRole={UserAccessLevel.ADMIN}>
                    <UsersPage loggedInUser={currentUser} />
                  </ProtectedRoute>
                } 
              />
              <Route path="/settings" element={<ProtectedRoute requiredRole={UserAccessLevel.ADMIN}><CompanySettingsPage /></ProtectedRoute>} />
              
              <Route path="/orders" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><OrdersPage /></ProtectedRoute>} />
              <Route path="/cashflow" element={<ProtectedRoute requiredRole={UserAccessLevel.ADMIN}><CashFlowPage /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} /> 
            </Routes>
          </main>
        </div>
      </div>
      <ViewQuoteDetailsModal
        isOpen={isViewDetailsModalOpenForGlobal}
        onClose={handleCloseViewDetailsForGlobal}
        quote={selectedQuoteForGlobalView}
      />
    </HashRouter>
  );
};

export default App;