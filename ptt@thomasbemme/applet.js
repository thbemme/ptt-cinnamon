const Applet = imports.ui.applet;
const Lang = imports.lang;
const Main = imports.ui.main;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;

const UUID = "ptt@thomasbemme";

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        this.uuid = UUID;
        global.log("PTT Applet: Initializing ptt applet");

        try {
            global.log("PTT Applet: Initializing PTT Applet Settings")
            this.settings = new Settings.AppletSettings(this, this.uuid, instance_id);
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "keybinding_ptt_toggle",
                "keybinding_ptt_toggle",
                this.keybindset_ptt_toggle,
                null);
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "keybinding_ptt_key",
                "keybinding_ptt_key",
                this.keybindset_ptt_activate,
                null);
            this.settings.bindProperty(Settings.BindingDirection.IN,
                "darkmode",
                "darkmode",
                this.set_darkmode,
                null);
        } catch (e) {
            global.logError(e);
            global.log("PTT Applet: Error initializing from Settings, continuing.")
            this.settings = null;
            this.keybinding_ptt_toggle = "F12";
            this.keybinding_ptt_key = "F11"
        }

        this.active = false;
        this.ptt_active = false;
        this.ptt_active_time = 0;
        this.is_audio_muted();
        this.preserve_state = this.is_muted;
        this.set_darkmode();
        this.set_icon();
        this.set_applet_icon_name(this.icon_mic_on);
        this.set_applet_tooltip(_('Click or press ' + this.keybinding_ptt_toggle + ' to activate PTT'));
        this.keybindset_ptt_toggle();
        global.log("PTT Applet: Initializing ptt loop");
        this.refresh_loop();
    },
    set_darkmode: function() {
        if (this.darkmode) {
            this.icon_mic_off = "micoff_dark";
            this.icon_mic_on = "microphone_dark";
            this.icon_mic_capture = "micon_dark";
            this.icon_mic_pause = "micready_dark";
        } else {
            this.icon_mic_off = "micoff";
            this.icon_mic_on = "microphone";
            this.icon_mic_capture = "micon";
            this.icon_mic_pause = "micready";
        }
    },
    refresh_loop: function() {
        this.is_audio_muted();
        if (this.active) {

            if (this.ptt_active && this.is_muted) {
                this.set_cap();
            }
            if (!this.ptt_active && !this.is_muted) {
                this.set_nocap();
            }
        }
        Mainloop.timeout_add(500, Lang.bind(this, this.refresh_loop));
        this.set_icon();
        this.ptt_active = false;
    },
    ptt_activate: function() {
        this.ptt_active = true;
    },
    keybindset_ptt_activate: function() {
        if (this.active) {
            this.keybindid = this.uuid.concat("_activate");
            if (this.keybinding_ptt_key != null) {
                Main.keybindingManager.addHotKey(this.keybindid, this.keybinding_ptt_key, Lang.bind(this, this.ptt_activate));
            }
        }
    },
    keybindremove_ptt_activate: function() {
        this.keybindid = this.uuid.concat("_activate");
        Main.keybindingManager.removeHotKey(this.keybindid);
    },
    keybindset_ptt_toggle: function() {
        this.keybindid = this.uuid.concat("_toggle");
        if (this.keybinding_ptt_toggle != null) {
            Main.keybindingManager.addHotKey(this.keybindid, this.keybinding_ptt_toggle, Lang.bind(this, this.on_applet_clicked));
        }
    },
    keybindremove_ptt_toggle: function() {
        this.keybindid = this.uuid.concat("_toggle");
        Main.keybindingManager.removeHotKey(this.keybindid);
    },

    is_audio_muted: function() {
        try {
            let cmd = ["bash", "-c", "amixer sget Capture"];
            Util.spawn_async(cmd, (stdout) => {
                try {
                    if (stdout.toString().indexOf("] [on]") != -1) {
                        this.is_muted = false;
                    } else {
                        this.is_muted = true;
                    }
                } catch (e) {
                    global.logError(e);
                }
            });
        } catch (e) {
            global.logError(e);
        }
    },
    set_icon: function() {
        if (this.active) {
            if (this.is_muted) {
                this.current_icon = this.icon_mic_pause;
                this.set_applet_icon_name(this.icon_mic_pause);
            } else {
                this.current_icon = this.icon_mic_capture;
                this.set_applet_icon_name(this.icon_mic_capture);
            }
        } else {
            if (this.is_muted) {
                this.current_icon = this.icon_mic_off;
                this.set_applet_icon_name(this.icon_mic_off);
            } else {
                this.current_icon = this.icon_mic_on;
                this.set_applet_icon_name(this.icon_mic_on);
            }
        }
    },

    set_cap: function() {
        try {
            let cmd = ["bash", "-c", "amixer set Capture cap"];
            Util.spawn_async(cmd, (stdout) => {
                try {
                    if (stdout.toString().indexOf("] [on]") != -1) {
                        this.is_muted = false;
                    } else {
                        this.is_muted = true;
                    }
                } catch (e) {
                    global.logError(e);
                }
            });
        } catch (e) {
            global.logError(e);
        }
        global.log("PTT Applet: Starting capture");
    },
    set_nocap: function() {
        try {
            let cmd = ["bash", "-c", "amixer set Capture nocap"];
            Util.spawn_async(cmd, (stdout) => {
                try {
                    if (stdout.toString().indexOf("] [on]") != -1) {
                        this.is_muted = false;
                    } else {
                        this.is_muted = true;
                    }
                } catch (e) {
                    global.logError(e);
                }
            });
        } catch (e) {
            global.logError(e);
        }
        global.log("PTT Applet: Stoping capture");
    },
    on_applet_clicked: function(event) {
        if (this.active) {
            this.active = false;
            this.keybindremove_ptt_activate();
            this.set_applet_tooltip(_('Click or press ' + this.keybinding_ptt_toggle + ' to activate PTT'));
            global.log("PTT Applet: Disable ptt and remove keybind");
            if (this.preserve_state) {
                this.set_nocap();
            } else {
                this.set_cap();
            }

        } else {
            this.preserve_state = this.is_muted;
            this.active = true;
            this.keybindset_ptt_activate();
            this.set_applet_tooltip(_('PTT is active, '+ this.keybinding_ptt_key + ' to talk'));
            global.log("PTT Applet: Enable ptt and add keybind");
        }
    },
};

function MyApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

function main(metadata, orientation, panel_height, instance_id) {
    let myApplet = new MyApplet(metadata, orientation, panel_height, instance_id);
    return myApplet;
}
