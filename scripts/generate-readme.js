#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const mainApps = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf-8'));
const recentData = JSON.parse(fs.readFileSync(path.join(ROOT, 'recently-added.json'), 'utf-8'));
const recentlyAdded = recentData.apps || recentData;
const apps = [...mainApps, ...recentlyAdded];

const TAG_EMOJI = {
  'IDK': ':question:',
  '2FA': ':clock1:',
  'Ad Blocker': ':no_entry_sign:',
  'App Manager': ':package:',
  'App Store': ':shopping:',
  'Artificial Intelligence': ':robot:',
  'Backup': ':floppy_disk:',
  'Battery': ':battery:',
  'Browser': ':globe_with_meridians:',
  'Calculator': ':1234:',
  'Calendar': ':calendar:',
  'Camera': ':camera:',
  'Chat & Messaging': ':speech_balloon:',
  'Clock & Time': ':watch:',
  'Communication': ':telephone_receiver:',
  'Device automation': ':joystick:',
  'Diary & Journal': ':pencil2:',
  'Dictionary': ':books:',
  'Downloader & Manager': ':arrow_down:',
  'Drawing': ':paintbrush:',
  'Email': ':email:',
  'File': ':file_folder:',
  'Finance': ':moneybag:',
  'Flashcard': ':card_file_box:',
  'Flashlight': ':flashlight:',
  'Games & Emulator': ':video_game:',
  'Icon Pack': ':flower_playing_cards:',
  'Image': ':mount_fuji:',
  'Keyboard': ':keyboard:',
  'Launcher': ':house:',
  'Maps & Navigation': ':compass:',
  'Media (Audio/Video)': ':clapper:',
  'Network': ':signal_strength:',
  'Note': ':memo:',
  'Office': ':computer:',
  'Optimizer & Cleaner': ':broom:',
  'Painting': ':art:',
  'Password & Authentication': ':closed_lock_with_key:',
  'Privacy': ':lock:',
  'Recorder': ':microphone:',
  'Reader & Viewer': ':book:',
  'Research & Development': ':mag:',
  'Sandboxing': ':shield:',
  'Science & Education': ':mortar_board:',
  'Scanner': ':microscope:',
  'Shopping': ':shopping_cart:',
  'Social Network': ':busts_in_silhouette:',
  'Sport & Health': ':running:',
  'Synchronisation': ':arrows_counterclockwise:',
  'System': ':toolbox:',
  'Text Editor & Code Editor/IDE': ':black_nib:',
  'Text-to-Speech': ':speaking_head:',
  'ToDo List': ':clipboard:',
  'Translator': ':secret:',
  'URL Manipulation': ':anchor:',
  'Utilities': ':wrench:',
  'VM': ':package:',
  'VPN': ':earth_africa:',
  'Wallpaper': ':iphone:',
  'Weather': ':sunny:',
};

const WARNING_TAGS = [
  'Telegram', 'Discord', 'Facebook', 'Github', 'Pixiv',
  'Reddit', 'Steam', 'VK', 'X(Twitter)', 'Xda',
  'Subsonic Client', 'Spotify Client', 'YouTube', 'YouTube Music', 'Twitch',
];

const SECTION_ORDER = [
  'IDK', '2FA', 'Ad Blocker', 'App Manager', 'App Store',
  'Artificial Intelligence', 'Backup', 'Battery', 'Browser',
  'Calculator', 'Calendar', 'Camera', 'Chat & Messaging',
  'Clock & Time', 'Communication', 'Device automation',
  'Diary & Journal', 'Dictionary', 'Downloader & Manager',
  'Drawing', 'Email', 'File', 'Finance', 'Flashcard',
  'Flashlight', 'Games & Emulator', 'Icon Pack', 'Image',
  'Keyboard', 'Launcher', 'Maps & Navigation', 'Media (Audio/Video)',
  'Network', 'Note', 'Office', 'Optimizer & Cleaner', 'Painting',
  'Password & Authentication', 'Privacy', 'Recorder', 'Reader & Viewer',
  'Research & Development', 'Sandboxing', 'Science & Education',
  'Scanner', 'Shopping', 'Social Network', 'Sport & Health',
  'Synchronisation', 'System', 'Text Editor & Code Editor/IDE',
  'Text-to-Speech', 'ToDo List', 'Translator', 'URL Manipulation',
  'Utilities', 'VM', 'VPN', 'Wallpaper', 'Weather',
];

const SUB_SECTIONS = {
  'Browser': ['Bookmark Manager/Read It Later', 'Chromium Based', 'Gecko Based (Firefox)', 'Other', 'Tools'],
  'Chat & Messaging': ['Matrix', 'Signal', 'Telegram'],
  'Clock & Time': ['Timer'],
  'Communication': ['Contact', 'Call Blocker/Spam Filter', 'Dialer', 'SMS'],
  'Email': ['Email Alias', 'Email Client', 'Email Forwarding'],
  'File': ['File Manager', 'File Sharing'],
  'Finance': ['Card Wallet', 'Expense Tracker'],
  'Downloader & Manager': ['Book/Ebook', 'Music', 'Torrent', 'Video', 'YouTube'],
  'Games & Emulator': ['Board', 'Card', 'Educational', 'Emulators', 'Logic', 'Puzzle', 'Snake', 'Sudoku', 'Tic Tac Toe', 'Quiz/Trivia', 'Online'],
  'Image': ['Image Manipulation', 'Image Viewer & Gallery'],
  'Media (Audio/Video)': ['Equalizer', 'Music', 'Music/Audio Player', 'Podcast/Audio Player', 'Subsonic Client', 'Spotify Client', 'Streaming', 'YouTube', 'YouTube Music', 'Twitch', 'Video Player', 'Video Editor'],
  'Network': ['DNS', 'Firewall', 'Link'],
  'Privacy': ['File & App Encryption', 'Permission Manager'],
  'Reader & Viewer': ['PDF', 'Manga & Anime', 'News', 'RSS Reader'],
  'Scanner': ['QR & Barcode Scanner', 'Document Scanner'],
  'Social Network': ['Discord', 'Facebook', 'Github', 'Lemmy', 'Mastodon', 'Pixiv', 'Reddit', 'Steam', 'VK', 'X(Twitter)', 'Xda'],
  'Sport & Health': ['Tracker'],
  'System': ['ADB Tools', 'Gesture Control', 'GSI', 'Info', 'Phone Link', 'Shizuku', 'SuperUser', 'Terminal', 'Theme'],
};

const TELEGRAM_SUBS = ['Tools'];

function getAppsForTag(tag) {
  return apps
    .filter(a => a.tags.includes(tag))
    .sort((a, b) => a.applicationName.toLowerCase().localeCompare(b.applicationName.toLowerCase()));
}

function formatApp(app, indent = '') {
  let line = `${indent}- [${app.applicationName}](${app.url})`;
  if (app.isFork) line += ' **`FORK`**';
  if (app.isDead) line += ' **`DEAD`**';
  return line;
}

function writeAppList(appList) {
  let out = '';
  const childrenOf = new Map();
  const topLevel = [];

  for (const app of appList) {
    if (app.isFork && app.urlFork) {
      // Check if parent is in this same list
      const parentInList = appList.some(a => a.url === app.urlFork);
      if (parentInList) {
        if (!childrenOf.has(app.urlFork)) childrenOf.set(app.urlFork, []);
        childrenOf.get(app.urlFork).push(app);
        continue;
      }
    }
    topLevel.push(app);
  }

  for (const app of topLevel) {
    out += formatApp(app) + '\n';
    const forks = childrenOf.get(app.url);
    if (forks) {
      for (const fork of forks) {
        out += formatApp(fork, '  ') + '\n';
      }
    }
  }
  return out;
}

function sectionAnchor(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 /-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\//g, '');
}

function buildReadme() {
  let md = '';

  // Header
  md += '# :green_heart: Android FOSS Apps \u2014 Full List\n\n';
  md += '> :globe_with_meridians: [Interactive website](https://f3ffo.github.io/AndroidFossApps/) \u00b7 ';
  md += ':arrow_left: [Back to README](README.md)\n\n';
  md += '---\n\n';

  md += '## :arrow_right: Abbreviations\n\n';
  md += '| Abbreviation | Meaning |\n';
  md += '| :----------: | ------- |\n';
  md += '|  **`DEAD`**  | App whose development is discontinued/paused indefinitely. |\n';
  md += '|  **`FORK`**  | Projects that uses the source code of an other project as a starting point, then adds modifications on top of it. |\n';
  md += '|  :warning:   | Only the application is FOSS. The service is based on a closed-source or non-FOSS system. |\n\n';
  md += '---\n\n';

  md += '## :new: Newly Added Apps!\n\n';
  md += '<details>\n\n';
  md += `<summary>Last <b>${recentlyAdded.length} apps</b> that were recently added to list!</summary>\n\n`;
  for (const app of recentlyAdded) {
    md += `- [${app.applicationName}](${app.url})\n`;
  }
  md += '\n</details>\n\n';

  md += '## :scroll: Table of Contents\n\n';
  for (const section of SECTION_ORDER) {
    const emoji = TAG_EMOJI[section] || '';
    const prefix = emoji ? emoji + ' ' : '';
    const warning = WARNING_TAGS.includes(section) ? ' :warning:' : '';
    md += `- [${prefix}${section}${warning}](#${sectionAnchor(section)})\n`;
    if (SUB_SECTIONS[section]) {
      for (const sub of SUB_SECTIONS[section]) {
        const subWarning = WARNING_TAGS.includes(sub) ? ' :warning:' : '';
        md += `  - [${sub}${subWarning}](#${sectionAnchor(sub)})\n`;
      }
    }
  }
  md += '\n---\n\n## Apps\n\n';

  for (const section of SECTION_ORDER) {
    const emoji = TAG_EMOJI[section] || '';
    const prefix = emoji ? emoji + ' ' : '';
    md += `### ${prefix}${section}\n\n`;

    const subsForSection = SUB_SECTIONS[section] || [];
    const directApps = getAppsForTag(section).filter(
      app => !subsForSection.some(sub => app.tags.includes(sub))
    );

    if (directApps.length > 0) {
      md += writeAppList(directApps);
      md += '\n';
    }

    for (const sub of subsForSection) {
      const subApps = getAppsForTag(sub);
      if (subApps.length === 0) continue;

      const isWarning = WARNING_TAGS.includes(sub);

      if (sub === 'Tools' && section === 'Chat & Messaging') continue;

      md += `#### ${sub}\n\n`;

      if (isWarning) {
        md += '> [!WARNING]\n';
        md += '> Only the application is FOSS. The service is based on a closed-source or non-FOSS system.\n\n';
      }

      md += writeAppList(subApps);
      md += '\n';

      if (sub === 'Telegram') {
        const toolsApps = apps.filter(a => a.tags.includes('Telegram') && a.tags.includes('Tools'));
        if (toolsApps.length > 0) {
          md += '##### Tools\n\n';
          md += writeAppList(toolsApps);
          md += '\n';
        }
      }
    }

    md += `<sub>[:scroll: Table of Contents](#scroll-table-of-contents)</sub>\n\n---\n\n`;
  }

  md += '## :link: Sources\n\n';
  md += '- _Mastodon:_ [foss_android](https://mstdn.social/@foss_android)\n';
  md += '- _Lemmy:_ [degoogle](https://lemmy.ml/c/degoogle), [android](https://lemmy.world/c/android)\n';
  md += '- _Reddit:_ [r/fossdroid](https://www.reddit.com/r/fossdroid/)\n';
  md += '- _Telegram:_ [WSTprojects](https://t.me/WSTprojects), [FossDroid](https://t.me/FossDroidAndroid), [popMODS](https://t.me/popMODS)\n';
  md += '- _Similar Lists:_ [Android FOSS](https://github.com/offa/android-foss/tree/master), [Material You Apps List](https://github.com/nyas1/Material-You-app-list), [degoogle](https://github.com/tycrek/degoogle), [AAA](https://github.com/Psyhackological/AAA)\n';

  return md;
}

const readme = buildReadme();
fs.writeFileSync(path.join(ROOT, 'APPS.md'), readme, 'utf-8');
console.log(`apps: ${mainApps.length}, recently added: ${recentlyAdded.length}, total: ${apps.length}`);
