import { useState } from 'react'
import { useGame } from './state/GameContext'
import HomeScreen from './screens/HomeScreen'
import ScenarioSelect from './screens/ScenarioSelect'
import GameScreen from './screens/GameScreen'
import ReportScreen from './screens/ReportScreen'
import TutorScreen from './screens/TutorScreen'
import LicenceScreen from './screens/LicenceScreen'
import SavingsScreen from './screens/SavingsScreen'
import { ALIGNMENT_STATEMENT } from './types'

export type ScreenId = 'home' | 'select' | 'game' | 'report' | 'tutor' | 'licence' | 'savings'

export default function App() {
  const { state, tutor } = useGame()
  const [screen, setScreen] = useState<ScreenId>(() =>
    state.scenarioId ? (state.completed ? 'report' : 'game') : 'home',
  )

  return (
    <div className="min-h-full flex flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-2 flex items-center gap-3">
        <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-left">
          <span className="text-2xl">🚧</span>
          <span>
            <span className="block font-bold leading-tight">Construction Phase Planner</span>
            <span className="block text-xs text-amber-400 leading-tight">SMSTS Safety Challenge</span>
          </span>
        </button>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {state.scenarioId && !state.completed && (
            <NavBtn active={screen === 'game'} onClick={() => setScreen('game')}>Resume Game</NavBtn>
          )}
          {state.scenarioId && state.completed && (
            <NavBtn active={screen === 'report'} onClick={() => setScreen('report')}>Reports</NavBtn>
          )}
          <NavBtn active={screen === 'tutor'} onClick={() => setScreen('tutor')}>
            Tutor Mode {tutor.enabled && <span className="ml-1 inline-block w-2 h-2 rounded-full bg-emerald-400" />}
          </NavBtn>
          <NavBtn active={screen === 'savings'} onClick={() => setScreen('savings')}>Savings</NavBtn>
          <NavBtn active={screen === 'licence'} onClick={() => setScreen('licence')}>Licensing</NavBtn>
        </nav>
      </header>

      <main className="flex-1">
        {screen === 'home' && (
          <HomeScreen
            onStart={() => setScreen('select')}
            onTutor={() => setScreen('tutor')}
            onResume={() => setScreen(state.completed ? 'report' : 'game')}
          />
        )}
        {screen === 'select' && <ScenarioSelect onStarted={() => setScreen('game')} />}
        {screen === 'game' && <GameScreen onFinished={() => setScreen('report')} onExit={() => setScreen('home')} />}
        {screen === 'report' && <ReportScreen onRestart={() => setScreen('select')} />}
        {screen === 'tutor' && <TutorScreen onSelectScenario={() => setScreen('select')} onViewReport={() => setScreen('report')} />}
        {screen === 'licence' && <LicenceScreen />}
        {screen === 'savings' && <SavingsScreen />}
      </main>

      <footer className="no-print border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500 leading-snug">
        {ALIGNMENT_STATEMENT}
      </footer>
    </div>
  )
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md transition-colors ${active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'}`}
    >
      {children}
    </button>
  )
}
