import { useRef, useState } from 'react'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import PrivacySection from './components/PrivacySection'
import QuickMatch from './components/QuickMatch'
import ToolGrid from './components/ToolGrid'
import Workspace from './components/Workspace'
import { I18nProvider } from './i18n'
import { compatibleTools, getTool } from './tools/definitions'

function AppContent() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const [workspaceFiles, setWorkspaceFiles] = useState<File[]>([])
  const [workspaceKey, setWorkspaceKey] = useState(0)
  const [quickFiles, setQuickFiles] = useState<File[]>([])
  const workspaceRef = useRef<HTMLDivElement>(null)
  const quickRef = useRef<HTMLDivElement>(null)

  const scrollTo = (element: HTMLElement | null) => {
    window.setTimeout(() => {
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const openTool = (id: string, files: File[] = []) => {
    setActiveToolId(id)
    setWorkspaceFiles(files)
    setWorkspaceKey((key) => key + 1)
    setQuickFiles([])
    scrollTo(workspaceRef.current)
  }

  const handleQuickFiles = (files: File[]) => {
    if (files.length === 0) return
    const matches = compatibleTools(files.map((file) => file.name))
    if (matches.length === 1) {
      openTool(matches[0].id, files)
      return
    }
    setActiveToolId(null)
    setQuickFiles(files)
    scrollTo(quickRef.current)
  }

  const closeWorkspace = () => {
    setActiveToolId(null)
    setWorkspaceFiles([])
    window.setTimeout(() => {
      document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const activeTool = activeToolId ? getTool(activeToolId) : undefined

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header />
      <main>
        <Hero onQuickFiles={handleQuickFiles} onOpenTool={(id) => openTool(id)} />

        {quickFiles.length > 0 && (
          <div ref={quickRef}>
            <QuickMatch
              files={quickFiles}
              onSelect={(id) => openTool(id, quickFiles)}
              onClear={() => setQuickFiles([])}
            />
          </div>
        )}

        {activeTool && (
          <div ref={workspaceRef}>
            <Workspace
              key={`${activeTool.id}-${workspaceKey}`}
              tool={activeTool}
              initialFiles={workspaceFiles}
              onClose={closeWorkspace}
            />
          </div>
        )}

        <ToolGrid onSelect={(id) => openTool(id)} />
        <HowItWorks />
        <PrivacySection />
      </main>
      <Footer onOpenTool={(id) => openTool(id)} />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}
