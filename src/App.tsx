import { useAppStore } from './store/appStore'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './components/home/HomePage'
import { Workspace } from './components/workspace/Workspace'
import { ValidationDrawer } from './components/shared/ValidationDrawer'
import { ToastContainer } from './components/shared/ToastContainer'
import { BookmarkDialog } from './components/shared/BookmarkDialog'
import { LibraryModal } from './components/shared/LibraryModal'

export default function App() {
  const view = useAppStore((s) => s.view)

  return (
    <>
      <AppShell>{view === 'home' ? <HomePage /> : <Workspace />}</AppShell>
      <ValidationDrawer />
      <ToastContainer />
      <BookmarkDialog />
      <LibraryModal />
    </>
  )
}
