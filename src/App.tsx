import { useState, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { IntroSection } from './components/intro/IntroSection'
import { MainMenu } from './components/layout/MainMenu'
import { MENU_LINKS } from './components/layout/menuLinks'
import { AboutSection } from './components/sections/AboutSection'
import { MembersSection } from './components/sections/MembersSection'

const SECTIONS: Record<string, ComponentType> = {
  acerca: AboutSection,
  miembros: MembersSection,
}

function App() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const navigate = (id: string | null) => {
    if (id === activeSection) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reducedMotion) {
      setActiveSection(id)
      return
    }
    document.startViewTransition(() => {
      flushSync(() => setActiveSection(id))
    })
  }

  const ActiveSection = activeSection !== null ? SECTIONS[activeSection] : undefined
  const placeholderLabel = MENU_LINKS.find(([, id]) => id === activeSection)?.[0]

  return (
    <IntroSection>
      <MainMenu activeSection={activeSection} onNavigate={navigate} />
      {ActiveSection && <ActiveSection />}
      {activeSection !== null && !ActiveSection && (
        <section className="section-panel" id={activeSection}>
          <div className="section-panel__inner">
            <h2>{placeholderLabel}</h2>
            <p>Sección en construcción.</p>
          </div>
        </section>
      )}
    </IntroSection>
  )
}

export default App
