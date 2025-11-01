import INDEX from '../pages/index.jsx';
import LIBRARY from '../pages/library.jsx';
import VIEWER from '../pages/viewer.jsx';
import SETTINGS from '../pages/settings.jsx';
import UPGRADE from '../pages/upgrade.jsx';
import DASHBOARD from '../pages/dashboard.jsx';
export const routers = [{
  id: "index",
  component: INDEX
}, {
  id: "library",
  component: LIBRARY
}, {
  id: "viewer",
  component: VIEWER
}, {
  id: "settings",
  component: SETTINGS
}, {
  id: "upgrade",
  component: UPGRADE
}, {
  id: "dashboard",
  component: DASHBOARD
}]