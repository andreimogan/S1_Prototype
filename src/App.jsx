import TopNav from './components/TopNav'
import MapView from './components/MapView'
import SuccessNotifications from './components/notifications/SuccessNotifications'
import {
  EventAffectedAreaPanel,
  WaterOSCopilotPanel,
  ManageMapLayersPanel,
  PressureZonePanel,
  SensorDetailsPanel,
  PipeDetailsPanel,
} from './components/panels'
import { PanelProvider, usePanelContext } from './contexts/PanelContext'

function AppContent() {
  const { openWaterMains } = usePanelContext()
  
  return (
    <>
      <TopNav />
      <main
        className="relative flex-1 min-h-[calc(100vh-var(--nav-height))] bg-[var(--content-bg)]"
        aria-label="Main content"
      >
        <MapView />
        <SuccessNotifications />
        <EventAffectedAreaPanel />
        <WaterOSCopilotPanel />
        <ManageMapLayersPanel />
        <PressureZonePanel />
        <SensorDetailsPanel />
        {openWaterMains.map((waterMain, index) => (
          <PipeDetailsPanel 
            key={waterMain.uniqueId} 
            waterMain={waterMain} 
            index={index}
          />
        ))}
      </main>
    </>
  )
}

function App() {
  return (
    <PanelProvider>
      <AppContent />
    </PanelProvider>
  )
}

export default App
