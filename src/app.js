/* eslint-disable import/prefer-default-export */
import Vue from 'vue';
import Vuetify from 'vuetify';

import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';
import vtkProxyManager from 'vtk.js/Sources/Proxy/Core/ProxyManager';

/* eslint-disable-next-line import/extensions */
import 'typeface-roboto';
import 'vuetify/dist/vuetify.min.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

import 'paraview-glance/src/io/ParaViewGlanceReaders';
import ReaderFactory from 'paraview-glance/src/io/ReaderFactory';
import App from 'paraview-glance/src/components/core/App';
import Config from 'paraview-glance/src/config';
import CropWidget from 'paraview-glance/src/vtkwidgets/CropWidget';
import vtkListenerHelper from 'paraview-glance/src/ListenerHelper';
import vtkWidgetManager from 'paraview-glance/src/vtkwidgets/WidgetManager';
import { Widgets } from 'paraview-glance/src/constants';

// Expose IO API to Glance global object
export const {
  registerReader,
  listReaders,
  listSupportedExtensions,
  openFiles,
  loadFiles,
  registerReadersToProxyManager,
} = ReaderFactory;

Vue.use(Vuetify);

// setup event bus
Vue.prototype.$globalBus = new Vue();

let activeProxyConfig = null;
/**
 * Sets the active proxy configuration to be used by createViewer.
 *
 * Once createViewer() is called, setActiveProxyConfiguration will do nothing.
 * Proxy config precedence (decreasing order):
 *   createViewer param, active proxy config, Generic config
 */
export function setActiveProxyConfiguration(config) {
  activeProxyConfig = config;
}

export function createViewer(container, proxyConfig = null) {
  const proxyConfiguration = proxyConfig || activeProxyConfig || Config.Proxy;

  const proxyManager = vtkProxyManager.newInstance({ proxyConfiguration });
  const renderListener = vtkListenerHelper.newInstance(
    proxyManager.autoAnimateViews,
    () =>
      [].concat(
        proxyManager.getSources(),
        proxyManager.getRepresentations(),
        proxyManager.getViews()
      )
  );

  proxyManager.onProxyRegistrationChange(renderListener.resetListeners);

  const widgetManager = vtkWidgetManager.newInstance({ proxyManager });
  widgetManager.registerWidgetGroup(Widgets.CROP, CropWidget);

  /* eslint-disable no-new */
  const vm = new Vue({
    el: '#root-container',
    components: { App },
    provide: {
      proxyManager,
      widgetManager,
    },
    template: '<App ref="app" />',
  });

  return {
    processURLArgs() {
      const { name, url, type } = vtkURLExtract.extractURLParameters();
      if (name && url) {
        vm.$refs.app.loadRemoteDataset(url, name, type);
      }
    },
  };
}
