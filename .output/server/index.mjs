globalThis.__nitro_main__ = import.meta.url;
import "./_libs/unenv.mjs";

import { H as HookableCore } from "./_libs/hookable.mjs";
import { d as defineLazyEventHandler, H as HTTPError, a as H3Core } from "./_libs/h3.mjs";
import { c as FastResponse } from "./_libs/srvx.mjs";


import "./_libs/rou3.mjs";





function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/index.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const assets = {
  "/assets/Combination-COsuataQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"77a1-aJtOcPNBgOk1mDsJeOHK4htGksw"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 30625,
    "path": "../public/assets/Combination-COsuataQ.js"
  },
  "/assets/admin-MorM6_wC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d49-7MQQDmsmLkxldN4abP4SfCUvSyg"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 11593,
    "path": "../public/assets/admin-MorM6_wC.js"
  },
  "/assets/admin.ads-C1PD96TY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10ff-8zg1KOSjbCZ1d/q77TcLHmGfF1E"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 4351,
    "path": "../public/assets/admin.ads-C1PD96TY.js"
  },
  "/assets/admin-project-status-BP5Q6jn5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8fe-mdt4IL+cBJ1KXM8SB6wtmUBSTeo"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 2302,
    "path": "../public/assets/admin-project-status-BP5Q6jn5.js"
  },
  "/assets/admin.bot-settings-CH9chVc5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1ec2-IURCV2f2ci1dJZdlhMJVfPn1orI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 7874,
    "path": "../public/assets/admin.bot-settings-CH9chVc5.js"
  },
  "/assets/admin.bot-test-Bt7cPBMA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"17e9-OcDEzzKV/hhHfTij6I+2XQuP1uE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 6121,
    "path": "../public/assets/admin.bot-test-Bt7cPBMA.js"
  },
  "/assets/admin.bot-training-CZpPgx63.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1e61-4LqdIt5dHEwbq6CFtu++dLZM9MU"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 7777,
    "path": "../public/assets/admin.bot-training-CZpPgx63.js"
  },
  "/assets/admin.chat-DDg_-8hV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"125b-dUlmNEPVXX5hhK2cEmiBCKmNE0s"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 4699,
    "path": "../public/assets/admin.chat-DDg_-8hV.js"
  },
  "/assets/admin.employees-WggDFqzs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"127a-+W6eRUO3ww9VO9KZsfb0CplhhE0"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 4730,
    "path": "../public/assets/admin.employees-WggDFqzs.js"
  },
  "/assets/admin.exclusivity-8Jml2e6m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1757-hK+ST3dXzzupIaya4UM+wCrGwQk"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 5975,
    "path": "../public/assets/admin.exclusivity-8Jml2e6m.js"
  },
  "/assets/admin.messages-BuXa189L.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3d93-kCx/VAsQmXlFCemIC325OSx6rKE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 15763,
    "path": "../public/assets/admin.messages-BuXa189L.js"
  },
  "/assets/admin.groq-settings-BLWfMxuo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"176a-S0W6lAhs/q7FYR7QCzE1PCBLXLM"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 5994,
    "path": "../public/assets/admin.groq-settings-BLWfMxuo.js"
  },
  "/assets/admin.my-projects-hP3vgFEQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e4d-qwQK97HfXqaK6zmSKzsKAumO6u0"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 3661,
    "path": "../public/assets/admin.my-projects-hP3vgFEQ.js"
  },
  "/assets/admin.projects-W3gHwhu7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"30a2-0Ai0NdNoH/5H8zWFDqnunuOqcbQ"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 12450,
    "path": "../public/assets/admin.projects-W3gHwhu7.js"
  },
  "/assets/admin.offers-CA55Fig7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"dea-jXV7QeeZSCax9Qbv+QDRz/Jpcrk"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 3562,
    "path": "../public/assets/admin.offers-CA55Fig7.js"
  },
  "/assets/admin.pending-projects-Dd-XVHDP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c33-pzTy+Bwajjkz0fVgi5Ge+x8/vjE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 3123,
    "path": "../public/assets/admin.pending-projects-Dd-XVHDP.js"
  },
  "/assets/admin.requests-PB2A9I8p.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4ce3-GHkjLtIxHIypTGrXOvApbx0W9ME"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 19683,
    "path": "../public/assets/admin.requests-PB2A9I8p.js"
  },
  "/assets/admin.settings-CdCN4Rje.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3bd7-Aa2p9ddarUJ0BncriluIQF9ltTA"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 15319,
    "path": "../public/assets/admin.settings-CdCN4Rje.js"
  },
  "/assets/admin.support-BvFuw7_G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1642-tjQ34Q80UJ4UPz7KBplRLmcd08g"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 5698,
    "path": "../public/assets/admin.support-BvFuw7_G.js"
  },
  "/assets/admin.vip-DXwctbZu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"243a-fCb4rVLs+SdLtWJHC8BKFQE3QmE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 9274,
    "path": "../public/assets/admin.vip-DXwctbZu.js"
  },
  "/assets/admin.users-DqsvT8Ia.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b85-aroWnh5biRMRyyUww6Jomq+8+Yg"',
    "mtime": "2026-08-23T01:56:01.683Z",
    "size": 2949,
    "path": "../public/assets/admin.users-DqsvT8Ia.js"
  },
  "/assets/ads-CGzGhVVe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7dd-Sz8RzA4iyw3eOdF2VDn93ZGbYxs"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 2013,
    "path": "../public/assets/ads-CGzGhVVe.js"
  },
  "/assets/ads._adId-CqPUwF8w.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1430-+rWYv+o1h5MQOZ1uFyYI/QHwj8Q"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 5168,
    "path": "../public/assets/ads._adId-CqPUwF8w.js"
  },
  "/assets/ads._adId-DJfALo6U.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"109-oxaHxD++y+++cKB0TY9dSK8yLyM"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 265,
    "path": "../public/assets/ads._adId-DJfALo6U.js"
  },
  "/assets/ads._adId-CsFzYprx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f0-gxbiGBk/vAN8xUu0ZsMFwJVU+IY"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 240,
    "path": "../public/assets/ads._adId-CsFzYprx.js"
  },
  "/assets/arrow-right-BK6akZIB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a6-LFanZ6sV4O4AqDZ/bTfugCZo/rE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 166,
    "path": "../public/assets/arrow-right-BK6akZIB.js"
  },
  "/assets/auth-C5jyFs2-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8f-n1C86rAAy/VhiaQqTWiOo3qqRl4"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 3727,
    "path": "../public/assets/auth-C5jyFs2-.js"
  },
  "/assets/bell-rMOkCzB4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"123-6u6N4gEz9oWHO47fpqvt4JVEwQk"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 291,
    "path": "../public/assets/bell-rMOkCzB4.js"
  },
  "/assets/bot-DfhouGPp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-D2+SwMJDqb7QpNb9MqAVfT1tR1M"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 329,
    "path": "../public/assets/bot-DfhouGPp.js"
  },
  "/assets/blocked.functions-BXaqZ0ww.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"23c-cS7rZ1J6JD+MuuW3qGeKtwXFBc8"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 572,
    "path": "../public/assets/blocked.functions-BXaqZ0ww.js"
  },
  "/assets/building-2-ClMGkArp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"180-euiCmEpI/sV857zmuDQsjlUqB/U"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 384,
    "path": "../public/assets/building-2-ClMGkArp.js"
  },
  "/assets/chat.functions-CZdV667V.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3e9-IYHh9ZRJshuf+jKY12g8lT32B68"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 1001,
    "path": "../public/assets/chat.functions-CZdV667V.js"
  },
  "/assets/contact-D3t3DLA8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"debc-z71akHF8CJqS5w3c3zhiq9k9l50"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 57020,
    "path": "../public/assets/contact-D3t3DLA8.js"
  },
  "/assets/chevron-down-Dft0FLq_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"81-AY5mEKxBAxxgSCgTmOQ8NeONsbA"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 129,
    "path": "../public/assets/chevron-down-Dft0FLq_.js"
  },
  "/assets/clock-CsIXuhe_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a5-rYaEdbhYXxUmlx6GAStpZOXV76M"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 165,
    "path": "../public/assets/clock-CsIXuhe_.js"
  },
  "/assets/check-DwPH3K7X.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"78-UkueXkYkBOsNQMYw24LxVUKBgJY"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 120,
    "path": "../public/assets/check-DwPH3K7X.js"
  },
  "/assets/copy-CgNQsWFg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8-W8hSOHjGDjAZfApre74T+mfrehI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 232,
    "path": "../public/assets/copy-CgNQsWFg.js"
  },
  "/assets/file-down-BJonvPFr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"164-+yNXhNlwvl4pLS91jRgBH7YeeGo"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 356,
    "path": "../public/assets/file-down-BJonvPFr.js"
  },
  "/assets/folder-kanban-DiuCn2ng.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"15e-W4quz0h/Xlmjeler/9+54zsBPe8"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 350,
    "path": "../public/assets/folder-kanban-DiuCn2ng.js"
  },
  "/assets/files.functions-qaJ-ssym.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2dd-kLOaEOZiSb3rrdxnhAQutzRIKeo"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 733,
    "path": "../public/assets/files.functions-qaJ-ssym.js"
  },
  "/assets/forgot-password-DgLUFi7d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a8d-HNglLEqP04GsZHauFFTUaNoxQ4M"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 2701,
    "path": "../public/assets/forgot-password-DgLUFi7d.js"
  },
  "/assets/index-Bbw-tX4W.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"86ae-a/zwMjyqazeIhcFjoCYQCHDTqT8"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 34478,
    "path": "../public/assets/index-Bbw-tX4W.js"
  },
  "/assets/index-BSJoPrNZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"80c6-uc4sjt+pa/VKKsk016ZNq/ZR4zI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 32966,
    "path": "../public/assets/index-BSJoPrNZ.js"
  },
  "/assets/index-BMQ2zbmq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"64d39-M7nLEwJ6kfGV1LR/lpVM73dzs+Q"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 412985,
    "path": "../public/assets/index-BMQ2zbmq.js"
  },
  "/assets/index-DtQeO8It.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"cc0-VkyOGZ/gFxnvOXdOBButFEz9AWw"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 3264,
    "path": "../public/assets/index-DtQeO8It.js"
  },
  "/assets/label-DRfCpHp3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"463-E6ewSonXLF8mii84t3geVecrw0I"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 1123,
    "path": "../public/assets/label-DRfCpHp3.js"
  },
  "/assets/lock-B3lDbvTt.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ca-bY4cKrX2x9wy4XFKYcz6VstZaYc"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 202,
    "path": "../public/assets/lock-B3lDbvTt.js"
  },
  "/assets/loader-circle-C0uyQ-uw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8c-Qk/IIhyzn55UWrh4iS2kF+FnGsI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 140,
    "path": "../public/assets/loader-circle-C0uyQ-uw.js"
  },
  "/assets/mail-LBnQscsZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d6-1d6yWULPshLjEbfAVGNhgGQJJkQ"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 214,
    "path": "../public/assets/mail-LBnQscsZ.js"
  },
  "/assets/maintenance-BIuzmQa5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8b5-ksRpaFijWD6WyA9hz/bdS21RFMI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 2229,
    "path": "../public/assets/maintenance-BIuzmQa5.js"
  },
  "/assets/map-pin-CZufcJtl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ff-GDxhxzbuzxzDs3LD15eBySKarXU"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 255,
    "path": "../public/assets/map-pin-CZufcJtl.js"
  },
  "/assets/megaphone-CRO_AGds.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"15b-KKOi3QWeiw+XglpEboP1bQzQQWU"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 347,
    "path": "../public/assets/megaphone-CRO_AGds.js"
  },
  "/assets/message-square-Cq-OGPRN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ea-2oBffGKPLRtrP9nfKDFxf4KfLkU"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 234,
    "path": "../public/assets/message-square-Cq-OGPRN.js"
  },
  "/assets/my-requests-uac8FNmY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d55-fSBlwBG/TtV0k5DHW8w8y5X3jpM"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 3413,
    "path": "../public/assets/my-requests-uac8FNmY.js"
  },
  "/assets/notifications.functions-D5f5JI2G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"396-xENq2vTzPea0ZSJMGmlodPyJZhI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 918,
    "path": "../public/assets/notifications.functions-D5f5JI2G.js"
  },
  "/assets/project-approval.functions-Bxuwu9y0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"333-f+IpWrxP1EGWRkALiVHU8+Ii4II"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 819,
    "path": "../public/assets/project-approval.functions-Bxuwu9y0.js"
  },
  "/assets/plus-5v6NenDA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9a-rMSu+1Qk2gg+TYDTmlceoEOCaU8"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 154,
    "path": "../public/assets/plus-5v6NenDA.js"
  },
  "/assets/project-bridge-CEy5d9F2.jpg": {
    "type": "image/jpeg",
    "etag": '"1e430-DsBDlKUCyzQ8t+Yq/SzY/YbgCmI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 123952,
    "path": "../public/assets/project-bridge-CEy5d9F2.jpg"
  },
  "/assets/project-hospital-C03d0OVK.jpg": {
    "type": "image/jpeg",
    "etag": '"1cb3f-fkgVm4TncAE99hHKgO1o8YJnXYo"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 117567,
    "path": "../public/assets/project-hospital-C03d0OVK.jpg"
  },
  "/assets/project-mall-C2poXo39.jpg": {
    "type": "image/jpeg",
    "etag": '"27b59-fV6rtxyH26q/FjFq15zw/R8z4c8"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 162649,
    "path": "../public/assets/project-mall-C2poXo39.jpg"
  },
  "/assets/project-school-ByfoLf-l.jpg": {
    "type": "image/jpeg",
    "etag": '"203ae-C/WwBhDqNHOZ7QDg/oO/TVHmVk0"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 132014,
    "path": "../public/assets/project-school-ByfoLf-l.jpg"
  },
  "/assets/project-tower-CY4UtbFp.jpg": {
    "type": "image/jpeg",
    "etag": '"2fdc6-uYw48yXkKFuV1+Kpdo0+fV8JD7c"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 196038,
    "path": "../public/assets/project-tower-CY4UtbFp.jpg"
  },
  "/assets/projects-0GN0FL4a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d8-UPGB9BghcWizgt+KnJD12vLRoHY"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 728,
    "path": "../public/assets/projects-0GN0FL4a.js"
  },
  "/assets/projects-rX3eoX3P.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2aec-bcz9FJapNl310fI7UxDdFPHsHwE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 10988,
    "path": "../public/assets/projects-rX3eoX3P.js"
  },
  "/assets/project._id-B8grCrPz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"26d7-kV/jZT1+43z9AB5DJo8JbidffLE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 9943,
    "path": "../public/assets/project._id-B8grCrPz.js"
  },
  "/assets/refresh-cw-DlxHo04H.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"142-rJpdtsKTWapmMUussAB0ZiSW+es"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 322,
    "path": "../public/assets/refresh-cw-DlxHo04H.js"
  },
  "/assets/reset-password-DdMNkmJp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"fe5-u/h3HpPVL5+9Ta7X2rI5/2qkEzE"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 4069,
    "path": "../public/assets/reset-password-DdMNkmJp.js"
  },
  "/assets/route-81FY2s6o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f-DMhRPXtBPrJmnlmZ96JESVu8sq4"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 95,
    "path": "../public/assets/route-81FY2s6o.js"
  },
  "/assets/project-villa-1KGCCkeh.jpg": {
    "type": "image/jpeg",
    "etag": '"2bc17-wDpnIyMZm6M3KaDQy0kW5It3154"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 179223,
    "path": "../public/assets/project-villa-1KGCCkeh.jpg"
  },
  "/assets/save-Ccgd0tKR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"148-HN30l/Np7SocaM7+xs8Fu3aT+Qk"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 328,
    "path": "../public/assets/save-Ccgd0tKR.js"
  },
  "/assets/search-Cf-AOvHn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"aa-hh/oxj4Po08ZugQHWi5ZBQUb1c8"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 170,
    "path": "../public/assets/search-Cf-AOvHn.js"
  },
  "/assets/select-CmplRvOX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"deea-2ff74gJioRuP8gCNEUGncS5HyLQ"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 57066,
    "path": "../public/assets/select-CmplRvOX.js"
  },
  "/assets/settings-2-CzXZeJwj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f8-1WuhW3a5fMnMa4LlzVBKiIIIlpg"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 248,
    "path": "../public/assets/settings-2-CzXZeJwj.js"
  },
  "/assets/share-2-DwBdO8oN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"245-K8mrMOmtHM71avgoDQs9MYH1a94"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 581,
    "path": "../public/assets/share-2-DwBdO8oN.js"
  },
  "/assets/site-footer-C098kXJw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"175-ZBedSrdJCZDwsFUKoO8jiQ8M5Xs"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 373,
    "path": "../public/assets/site-footer-C098kXJw.js"
  },
  "/assets/site-header-JRyZtEp-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"13fa-5BHX3xhaOOBXxfhFzrdARRxUW5g"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 5114,
    "path": "../public/assets/site-header-JRyZtEp-.js"
  },
  "/assets/sonner-B2aeSQrA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"215-lEEaQagltnfUlgxmHn91Mhfw1JA"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 533,
    "path": "../public/assets/sonner-B2aeSQrA.js"
  },
  "/assets/thank-you-LbXz4WuJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"538-jfyx6sPAQpnecwhSZI5Wiu/rC6k"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 1336,
    "path": "../public/assets/thank-you-LbXz4WuJ.js"
  },
  "/assets/styles-Dn6NL99h.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"182b3-qqhuEUSdHM3UHzepuhzNOh3Lpr4"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 98995,
    "path": "../public/assets/styles-Dn6NL99h.css"
  },
  "/assets/trash-2-CrGv1UN2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-SrFebHspP8hHiK8BV6gYLLtQDcg"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 329,
    "path": "../public/assets/trash-2-CrGv1UN2.js"
  },
  "/assets/table-Ckge8LwU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"63b-GKiJTStJT5Yd6Tojcalkd8QLuDU"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 1595,
    "path": "../public/assets/table-Ckge8LwU.js"
  },
  "/assets/star-NMFV8ILI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1d9-vQo0/kBaMpDeqkdbBSpDvzl9268"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 473,
    "path": "../public/assets/star-NMFV8ILI.js"
  },
  "/assets/subscribe-success-BaRavxa3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"532-qnsC3R6RDdVDPpxrGYaTSUPXIUM"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 1330,
    "path": "../public/assets/subscribe-success-BaRavxa3.js"
  },
  "/assets/unsubscribe-DH5MbR8f.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"727-ISN+hxsZjHZ3NrieomA8i+3wFlU"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 1831,
    "path": "../public/assets/unsubscribe-DH5MbR8f.js"
  },
  "/assets/upload-BA0tRypK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a7d-r2YiWOze//oP1jsnbC/LOHn/pz4"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 2685,
    "path": "../public/assets/upload-BA0tRypK.js"
  },
  "/assets/upload-CZcRmb2e.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e7-QtBI85OfEu+VW/1j8NWifp3aD3w"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 231,
    "path": "../public/assets/upload-CZcRmb2e.js"
  },
  "/assets/user-C5yVvmKH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c0-pqPXiwc3JZNofRKhFGtzhC6r1WI"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 192,
    "path": "../public/assets/user-C5yVvmKH.js"
  },
  "/assets/useMutation-Bahz3dJn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8a2-CQ+7Y9BUqlsv13XgbI6YqtyfZ+A"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 2210,
    "path": "../public/assets/useMutation-Bahz3dJn.js"
  },
  "/assets/vip.index-CGCLvxEp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3741-+6xSQDcAmLBgqXPslCs3mz0BD7A"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 14145,
    "path": "../public/assets/vip.index-CGCLvxEp.js"
  },
  "/assets/vip-BWIKg86Q.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f-DMhRPXtBPrJmnlmZ96JESVu8sq4"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 95,
    "path": "../public/assets/vip-BWIKg86Q.js"
  },
  "/assets/wrench-Cjdia3-c.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"12b-xzPJ40KyWq8EZm6UjCJuuZ5cGP4"',
    "mtime": "2026-08-23T01:56:01.679Z",
    "size": 299,
    "path": "../public/assets/wrench-Cjdia3-c.js"
  }
};
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key, value);
  }
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/"), l = s.length;
    if (l > 1) {
      if (s[1] === "assets") {
        r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
      }
    }
    return r;
  };
})();
const _lazy_21T4OO = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_21T4OO };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
  const unhandled = error.unhandled ?? !HTTPError.isError(error);
  const { status = 500, statusText = "" } = unhandled ? {} : error;
  if (status === 404) {
    const url = event.url || new URL(event.req.url);
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      return {
        status: 302,
        headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
      };
    }
  }
  const headers2 = new Headers(unhandled ? {} : error.headers);
  headers2.set("content-type", "application/json; charset=utf-8");
  const jsonBody = unhandled ? {
    status,
    unhandled: true
  } : typeof error.toJSON === "function" ? error.toJSON() : {
    status,
    statusText,
    message: error.message
  };
  return {
    status,
    statusText,
    headers: headers2,
    body: {
      error: true,
      ...jsonBody
    }
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
function createNitroApp() {
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({ error, context: errorCtx });
      }
    }
  };
  const h3App = createH3App({
    onError(error, event) {
      return errorHandler(error, event);
    }
  });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  return {
    fetch: appHandler,
    h3: h3App,
    hooks: void 0,
    captureError
  };
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~getMiddleware"] = (event, route) => {
    const pathname = event.url.pathname;
    const method = event.req.method;
    const middleware = [];
    const routeRules = getRouteRules(method, pathname);
    event.context.routeRules = routeRules?.routeRules;
    if (routeRules?.routeRuleMiddleware.length) {
      middleware.push(...routeRules.routeRuleMiddleware);
    }
    if (route?.data?.middleware?.length) {
      middleware.push(...route.data.middleware);
    }
    return middleware;
  };
  return h3App;
}
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function useNitroHooks() {
  const nitroApp = useNitroApp();
  const hooks = nitroApp.hooks;
  if (hooks) {
    return hooks;
  }
  return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
  for (const rule of orderedRules) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function createHandler(hooks) {
  const nitroApp = useNitroApp();
  const nitroHooks = useNitroHooks();
  return {
    async fetch(request, env, context) {
      globalThis.__env__ = env;
      augmentReq(request, {
        env,
        context
      });
      const ctxExt = {};
      const url = new URL(request.url);
      if (hooks.fetch) {
        const res = await hooks.fetch(request, env, context, url, ctxExt);
        if (res) {
          return res;
        }
      }
      return await nitroApp.fetch(request);
    },
    scheduled(controller, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
        controller,
        env,
        context
      }) || Promise.resolve());
    },
    email(message, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:email", {
        message,
        event: message,
        env,
        context
      }) || Promise.resolve());
    },
    queue(batch, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
        batch,
        event: batch,
        env,
        context
      }) || Promise.resolve());
    },
    tail(traces, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
        traces,
        env,
        context
      }) || Promise.resolve());
    },
    trace(traces, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
        traces,
        env,
        context
      }) || Promise.resolve());
    }
  };
}
function augmentReq(cfReq, ctx) {
  const req = cfReq;
  req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
  req.runtime ??= { name: "cloudflare" };
  req.runtime.cloudflare = {
    ...req.runtime.cloudflare,
    ...ctx
  };
  req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
const cloudflareModule = createHandler({ fetch(cfRequest, env, context, url) {
  if (env.ASSETS && isPublicAssetURL(url.pathname)) {
    return env.ASSETS.fetch(cfRequest);
  }
} });
export {
  cloudflareModule as default
};
