import ReaderFactory from 'paraview-glance/src/io/ReaderFactory';

import { Events, Messages } from 'paraview-glance/src/constants';
import Datasets from 'paraview-glance/src/components/core/Datasets';
import DragAndDrop from 'paraview-glance/src/components/widgets/DragAndDrop';
import GlobalSettings from 'paraview-glance/src/components/core/GlobalSettings';
import Landing from 'paraview-glance/src/components/core/Landing';
import LayoutView from 'paraview-glance/src/components/core/LayoutView';
import Notification from 'paraview-glance/src/components/core/Notification';
import Screenshots from 'paraview-glance/src/components/core/Screenshots';

// ----------------------------------------------------------------------------
// Component API
// ----------------------------------------------------------------------------

function loadFiles(files) {
  return ReaderFactory.loadFiles(files)
    .then((readers) => {
      ReaderFactory.registerReadersToProxyManager(readers, this.proxyManager);
    })
    .then(() => {
      this.landing = false;
    })
    .catch((error) => {
      if (error) {
        this.$globalBus.$emit(Events.MSG_ERROR, Messages.OPEN_ERROR);
      }
      // TODO display popup for raw parsing
      this.$globalBus.$emit(Events.MSG_INFO, 'TODO interpret as *.raw');
      this.landing = false;
    });
}

// ----------------------------------------------------------------------------

function loadRemoteDataset(url, name, type) {
  if (!url || !name) {
    return Promise.reject(new Error('No url or name provided'));
  }

  this.loadingName = name;
  this.loadingProgress = 0;

  const progressCb = (progress) => {
    this.loadingProgress = Math.round(100 * progress.loaded / progress.total);
  };

  return ReaderFactory.downloadDataset(name, url, progressCb)
    .then(({ reader, sourceType }) => {
      ReaderFactory.registerReadersToProxyManager(
        [{ reader, name, sourceType: type || sourceType }],
        this.proxyManager
      );
    })
    .then(() => {
      this.landing = false;
    })
    .finally(() => {
      this.loadingName = null;
    });
}

// ----------------------------------------------------------------------------

function openFile() {
  ReaderFactory.openFiles(
    // doesn't handle *.raw
    ReaderFactory.listSupportedExtensions(),
    (files) => this.loadFiles(files)
  );
}

// ----------------------------------------------------------------------------

export default {
  name: 'App',
  inject: ['proxyManager'],
  components: {
    Datasets,
    DragAndDrop,
    GlobalSettings,
    Landing,
    LayoutView,
    Notification,
    Screenshots,
  },
  data() {
    return {
      loadingName: null,
      loadingProgress: 0,
      landing: true,
      sidebar: true,
      aboutDialog: false,
      activeTab: 0,
      screenshotsDrawer: false,
      screenshotCount: 0,
    };
  },
  methods: {
    loadFiles,
    openFile,
    loadRemoteDataset,
  },
};
