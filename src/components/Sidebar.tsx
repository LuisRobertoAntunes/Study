'use client';

import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { FaHome, FaClipboardList, FaBook, FaFileAlt, FaDatabase, FaRedoAlt, FaHistory, FaChartBar, FaCalendarAlt, FaGraduationCap, FaHeart } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BsList } from 'react-icons/bs';
import ThemeToggleButton from './ThemeToggleButton';
import PlanSelector from './PlanSelector';
import { useTheme } from '../context/ThemeContext';
import { useSession, signOut } from 'next-auth/react';
import { FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa';


const Sidebar = () => {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = React.useState(false);
  const { isSidebarExpanded, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: session, status } = useSession();

  const logoSrc = theme === 'dark' ? '/logo-modo-escuro.svg' : '/logo.svg';

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${isSidebarExpanded ? 'translate-x-0' : '-translate-x-full'}
      bg-gold-500 text-white w-72 p-4 transition-transform duration-300 ease-in-out z-50 flex flex-col dark:bg-gray-800 dark:text-gray-100`}>

      <div className="flex-grow">
        {/* Sidebar Header */}
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-white p-2 rounded-md hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-white dark:hover:bg-gray-700 dark:focus:ring-gray-500">
            <BsList size={24} />
          </button>
          <div className="flex-grow flex justify-center">
            <img src={logoSrc} alt="Estudei Logo" className="h-20 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <ul>
            <li className="mb-2">
              <Link href="/dashboard" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/dashboard' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaHome className="mr-2" />Home</Link>
            </li>
            <li className="mb-2">
              <Link href="/planos" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/planos' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaClipboardList className="mr-2" />Planos</Link>
            </li>
            <li className="mb-2">
              <Link href="/materias" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/materias' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaBook className="mr-2" />Matérias</Link>
            </li>

            <li className="mb-2">
              <Link href="/edital" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/edital' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaFileAlt className="mr-2" />Edital</Link>
            </li>

            <li className="mb-2">
              <Link href="/planejamento" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/planejamento' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaCalendarAlt className="mr-2" />Planejamento</Link>
            </li>
            <li className="mb-2">
              <Link href="/historico" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/historico' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaHistory className="mr-2" />Histórico</Link>
            </li>
            <li className="mb-2">
              <Link href="/revisoes" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/revisoes' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaRedoAlt className="mr-2" />Revisões</Link>
            </li>
            <li className="mb-2">
              <Link href="/estatisticas" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/estatisticas' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaChartBar className="mr-2" />Estatísticas</Link>
            </li>
            <li className="mb-2">
              <Link href="/simulados" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/simulados' ? 'bg-gold-600' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaGraduationCap className="mr-2" />Simulados</Link>
            </li>
            <li className="mb-2">
              <Link href="/backup" className={`flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 ${pathname === '/backup' ? 'bg-gold-600 dark:bg-gray-700' : ''} dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100`}><FaDatabase className="mr-2" />Backup</Link>
            </li>
            {session && (
              <li className="mb-2">
                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="flex items-center p-2 rounded-md hover:bg-gold-600 transition-colors duration-200 w-full text-left dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:text-gray-100"
                >
                  <FaSignOutAlt className="mr-2" />Sair ({session.user?.name})
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t border-gold-400 dark:border-gray-700">
        <div className="flex items-center justify-between space-x-2">
          <ThemeToggleButton />
          <div className="flex-grow">
            <PlanSelector />
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Sair */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md w-screen h-screen left-0 top-0">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-slate-700 transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mx-auto mb-4">
              <FaExclamationTriangle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-slate-100 mb-2">
              Deseja realmente sair?
            </h3>
            
            <p className="text-gray-600 dark:text-slate-400 text-center mb-6">
              Você precisará fazer login novamente para acessar seus dados de estudo.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
