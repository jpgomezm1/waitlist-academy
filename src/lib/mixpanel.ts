import mixpanel from 'mixpanel-browser';

// Note: This is a public token, so it's safe to include in the codebase
const MIXPANEL_TOKEN = "b88afa4ea103829436234b50215e267d";

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: true, // Set to false in production
    track_pageview: true,
    persistence: 'localStorage'
  });
}

export const Mixpanel = {
  identify: (id: string) => {
    if (MIXPANEL_TOKEN) mixpanel.identify(id);
  },
  alias: (id: string) => {
    if (MIXPANEL_TOKEN) mixpanel.alias(id);
  },
  track: (name: string, props?: object) => {
    if (MIXPANEL_TOKEN) mixpanel.track(name, props);
  },
  people: {
    set: (props: object) => {
      if (MIXPANEL_TOKEN) mixpanel.people.set(props);
    },
  },
};