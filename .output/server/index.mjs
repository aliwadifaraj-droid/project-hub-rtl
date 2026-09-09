globalThis.__nitro_main__ = import.meta.url;
import "./_libs/unenv.mjs";

import { H as HookableCore } from "./_libs/hookable.mjs";
import { d as defineLazyEventHandler, H as HTTPError, a as H3Core } from "./_libs/h3.mjs";
import { c as FastResponse } from "./_libs/srvx.mjs";


import "./_libs/react.mjs";


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
  "/manifest.json": {
    "type": "application/json",
    "etag": '"3ef-9gv6gm3laVjwXUYCnj7vlPX9XKs"',
    "mtime": "2026-09-09T11:44:49.461Z",
    "size": 1007,
    "path": "../public/manifest.json"
  },
  "/sw-push.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7ef-j1fHmvoSMtdJe4WCQrIRqZE2tl4"',
    "mtime": "2026-09-09T11:44:49.461Z",
    "size": 2031,
    "path": "../public/sw-push.js"
  },
  "/sw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"518-aAZOWdc7o4LGHiqMWtfzYg4Y1Ag"',
    "mtime": "2026-09-09T11:44:49.461Z",
    "size": 1304,
    "path": "../public/sw.js"
  },
  "/assets/admin-DHnd5fo1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"309b-gnvepjifhzQtxOZo4FKlEiDihcA"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 12443,
    "path": "../public/assets/admin-DHnd5fo1.js"
  },
  "/assets/Combination-CNNqDqQQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"77a1-KVstV+Tm0OVmkJvT3l7tCmMXjyg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 30625,
    "path": "../public/assets/Combination-CNNqDqQQ.js"
  },
  "/assets/admin-project-status-NWVwU-G0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9ba-YX99cm+gnCT/2LF5K/OPo9/tvnU"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 2490,
    "path": "../public/assets/admin-project-status-NWVwU-G0.js"
  },
  "/assets/admin.bot-test-nFhdDxA0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1836-uTc5P8nQXatIQK9CTOmFkj0hK0A"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 6198,
    "path": "../public/assets/admin.bot-test-nFhdDxA0.js"
  },
  "/assets/admin.chat-Djn21f23.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"125b-DfwHMT+vlqE2jDgbRKU/pYLudHo"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 4699,
    "path": "../public/assets/admin.chat-Djn21f23.js"
  },
  "/assets/admin.clients-Bc5j2xMu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6a99-x51GFCQKo/qstv7F5ct9glP/Q5k"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 27289,
    "path": "../public/assets/admin.clients-Bc5j2xMu.js"
  },
  "/assets/admin.employees-Cyf2eLEL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1251-GjdX/yMikuad4ol7pwAmFju0czI"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 4689,
    "path": "../public/assets/admin.employees-Cyf2eLEL.js"
  },
  "/assets/admin.exclusivity-DZNl71B3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"172e-SxzIyQgbjMNQ6MCfBCqwkEL5b1M"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 5934,
    "path": "../public/assets/admin.exclusivity-DZNl71B3.js"
  },
  "/assets/admin.groq-settings-DFwYccSq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"176a-ndMBHeOK8b3nuHKQ1N12MHijT1g"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 5994,
    "path": "../public/assets/admin.groq-settings-DFwYccSq.js"
  },
  "/assets/admin.messages-OCuESkzI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3d6f-N1xF9WmXPqMToMERSpE+NREbQ+I"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 15727,
    "path": "../public/assets/admin.messages-OCuESkzI.js"
  },
  "/assets/admin.bot-settings-mnVD0n6n.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1ec2-m9f4aMVrqLPL/ahXJCDbKKa8UsE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 7874,
    "path": "../public/assets/admin.bot-settings-mnVD0n6n.js"
  },
  "/assets/admin.ads-CfGPj795.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"103e-Fzu7P921yhIOrkyo2jfZkcjwWVo"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 4158,
    "path": "../public/assets/admin.ads-CfGPj795.js"
  },
  "/assets/admin.offers-y2Gc-RBE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"cc1-qJHHov/4f2J0cLu8FA+WIJOpo+0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 3265,
    "path": "../public/assets/admin.offers-y2Gc-RBE.js"
  },
  "/assets/admin.bot-training-QaQLh16n.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1e61-RqR48L89NuOU+zAXLM1D0vpMgrs"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 7777,
    "path": "../public/assets/admin.bot-training-QaQLh16n.js"
  },
  "/assets/admin.projects-Bi2JJtE8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2f26-otvb9YLkrBv0on3e6BMPMTlcVyo"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 12070,
    "path": "../public/assets/admin.projects-Bi2JJtE8.js"
  },
  "/assets/admin.support-CmMfmDtF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"16fb-mp6t+s1aNOOjqPfEx9k4kKOYTbY"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 5883,
    "path": "../public/assets/admin.support-CmMfmDtF.js"
  },
  "/assets/admin.my-projects-CUrAnUvd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1f70-pGueNzWfrwLxvX54mAE7FFCtHL0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 8048,
    "path": "../public/assets/admin.my-projects-CUrAnUvd.js"
  },
  "/assets/admin.users-B-G8a9BA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b5c-MrXCLOcOkiAcNRNP77FiKKh3z9E"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 2908,
    "path": "../public/assets/admin.users-B-G8a9BA.js"
  },
  "/assets/admin.vip-BTVQhWCP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"26f3-pYSmZuI3Yo9ozc4MXzhg+xa7jAI"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 9971,
    "path": "../public/assets/admin.vip-BTVQhWCP.js"
  },
  "/assets/admin.pending-projects-CRS7LpRI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c0a-9H5pn3zB+CNaLokbrYq281WwGnQ"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 3082,
    "path": "../public/assets/admin.pending-projects-CRS7LpRI.js"
  },
  "/assets/admin.requests-DTk3NYdn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4ce2-xnFZd6axxfnCkq29HD1T9SThrto"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 19682,
    "path": "../public/assets/admin.requests-DTk3NYdn.js"
  },
  "/assets/admin.settings-BCIe7IFq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f2e-gzR9vnCakfmRGh0ROUjGhVOXeVs"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 24366,
    "path": "../public/assets/admin.settings-BCIe7IFq.js"
  },
  "/assets/ads._adId-BGP3n3DG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"109-peIUG9F6MPzoACYbY3Ej/aMkBV0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 265,
    "path": "../public/assets/ads._adId-BGP3n3DG.js"
  },
  "/assets/ads._adId-Dv5kUUXH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"142e-FMacikmYaqpvcwGU3VAYPZS7JpY"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 5166,
    "path": "../public/assets/ads._adId-Dv5kUUXH.js"
  },
  "/assets/ads-CzVQZaq8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7d9-jG0NeNjWa7IsNCtGDkFSascN+MM"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 2009,
    "path": "../public/assets/ads-CzVQZaq8.js"
  },
  "/assets/ads._adId-Dw0vdXu5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f0-pNsfTAj0UzZkhIV0hrFZ+xasCWg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 240,
    "path": "../public/assets/ads._adId-Dw0vdXu5.js"
  },
  "/assets/auth-CEZLnyTA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e0d-uXPLOv4Ea2ZjWD2Ph3f/rDjcH+g"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 3597,
    "path": "../public/assets/auth-CEZLnyTA.js"
  },
  "/assets/arrow-right-XYc42RiE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a6-V5f1Te8Yeg8jBjveFnrgBVRaOoM"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 166,
    "path": "../public/assets/arrow-right-XYc42RiE.js"
  },
  "/assets/ban-DytXpSl-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b1-wHrv4lnd91lVz0mD0WchWiH+d+U"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 177,
    "path": "../public/assets/ban-DytXpSl-.js"
  },
  "/assets/bell-DYIKP9uW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"123-o+ASECuVd4Y5apPz183SmTlb0M8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 291,
    "path": "../public/assets/bell-DYIKP9uW.js"
  },
  "/assets/bell-off-iCaq3hsv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"16e-cBAOIcyHjTphHQIjR+Cp1GUCNjU"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 366,
    "path": "../public/assets/bell-off-iCaq3hsv.js"
  },
  "/assets/blocked.functions-hh8Q4ZoQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1b5-83RkVC0F4uO+5eHNwK/Ic74sGg0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 437,
    "path": "../public/assets/blocked.functions-hh8Q4ZoQ.js"
  },
  "/assets/bot-CaOOO8Zr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-qAjMC74VBWKeNocS/dbB7KhynHU"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 329,
    "path": "../public/assets/bot-CaOOO8Zr.js"
  },
  "/assets/building-2-DSgvO6hr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"180-fEddimSbkud2c5uX8gc3IXLDTFw"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 384,
    "path": "../public/assets/building-2-DSgvO6hr.js"
  },
  "/assets/chat.functions-ne5e3xaf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3ea-bAhQkkLogG92VQwhGPNRy+Ul6vk"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 1002,
    "path": "../public/assets/chat.functions-ne5e3xaf.js"
  },
  "/assets/check-CrQTbpQN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"78-b53/whEkxyhQ1OoJ6vl/j0tBAw8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 120,
    "path": "../public/assets/check-CrQTbpQN.js"
  },
  "/assets/chevron-down-BXO5-4lj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"81-1nVcwPeoJaHH2JIu5BnKwxfP9qM"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 129,
    "path": "../public/assets/chevron-down-BXO5-4lj.js"
  },
  "/assets/circle-alert-Dg2SSRlK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"fb-wmfemvJUqd5Ith26hSeJedQvWyo"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 251,
    "path": "../public/assets/circle-alert-Dg2SSRlK.js"
  },
  "/assets/client-portal-Dt8DC6P8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6182-Q0NC0aAttZGtlmJpQQlZ09FhkNQ"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 24962,
    "path": "../public/assets/client-portal-Dt8DC6P8.js"
  },
  "/assets/clipboard-list-CqUbK1Dk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"19c-fOdK8czU7BUXTCbVNucw7MVNHAg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 412,
    "path": "../public/assets/clipboard-list-CqUbK1Dk.js"
  },
  "/assets/client-login-C3npf-LS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1575-Lh5SzofwBNQmXgMbmHZZWcX7MY8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 5493,
    "path": "../public/assets/client-login-C3npf-LS.js"
  },
  "/assets/clock-CGIObT1l.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a5-O+p88BhHs2ruSZaXWEkrJXuRXdA"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 165,
    "path": "../public/assets/clock-CGIObT1l.js"
  },
  "/assets/copy-DLXp2IRe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8-wtzDg6ePJmSrfF8+0w6fMo96ifY"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 232,
    "path": "../public/assets/copy-DLXp2IRe.js"
  },
  "/assets/crown-DD3fEvhZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"16b-F5Pgo92leBgBumtUr0m7dBAitvA"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 363,
    "path": "../public/assets/crown-DD3fEvhZ.js"
  },
  "/assets/contact-DWxHCvmt.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"deb8-XOn8b08wZw+Q/DnOQA+3Mpc5Fl4"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 57016,
    "path": "../public/assets/contact-DWxHCvmt.js"
  },
  "/assets/external-link-CE4Kg2_Y.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"fc-nTpvtMaFvWsX6gjr9BJED2PwlrY"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 252,
    "path": "../public/assets/external-link-CE4Kg2_Y.js"
  },
  "/assets/eye-C5n2Qns5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"fc-sFY8HRpXNionkDh9qkjpDZnEyI8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 252,
    "path": "../public/assets/eye-C5n2Qns5.js"
  },
  "/assets/file-down-Dbc4ltJS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"164-EAa265MeBXjUCX2MT38U8yVU6bs"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 356,
    "path": "../public/assets/file-down-Dbc4ltJS.js"
  },
  "/assets/file-text-CQJS8YV6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"182-ZDrul/T06TuPsR9oZb9YrDQ6zvE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 386,
    "path": "../public/assets/file-text-CQJS8YV6.js"
  },
  "/assets/files.functions-B_iNUoYe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2de-shtsFQxUZOXj6jXXnqpCPMugUNk"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 734,
    "path": "../public/assets/files.functions-B_iNUoYe.js"
  },
  "/assets/forgot-password-BaaMXZod.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c9e-HckPWnEeP8Vqu3dNqFVqvvYMRpI"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 3230,
    "path": "../public/assets/forgot-password-BaaMXZod.js"
  },
  "/assets/folder-kanban-MpI8jFXL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"15e-hVzdpU2DBuobeHcc8sq1mJPQ8Sw"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 350,
    "path": "../public/assets/folder-kanban-MpI8jFXL.js"
  },
  "/assets/index-Bq7OTvqr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"673a6-gCW/NMSBA7zooYrgkXz0v61R0j0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 422822,
    "path": "../public/assets/index-Bq7OTvqr.js"
  },
  "/assets/index-CR1zlhhD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ce5-U7QjbGt+u80E4mtjeAdhx4xlaB0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 3301,
    "path": "../public/assets/index-CR1zlhhD.js"
  },
  "/assets/index-Cu-SB_xy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"86ae-9/7rjGbjdYweaXz+28JvdohjRMU"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 34478,
    "path": "../public/assets/index-Cu-SB_xy.js"
  },
  "/assets/index-Co6R0_I5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"80c6-Os7ugbst8czn1xzckGwyQRlDTM8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 32966,
    "path": "../public/assets/index-Co6R0_I5.js"
  },
  "/assets/label-CnzX9BqF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"463-yaC5H+guBsf84Kk/okO0usjiYMQ"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 1123,
    "path": "../public/assets/label-CnzX9BqF.js"
  },
  "/assets/index-DgvX7Flt.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3dd5-Sx4hv1w5fqgjA0X+x2JPduVePmE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 15829,
    "path": "../public/assets/index-DgvX7Flt.js"
  },
  "/assets/lock-D-G4y6fN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ca-arrm5+yFsesuvrJDQPlgIBjU9KI"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 202,
    "path": "../public/assets/lock-D-G4y6fN.js"
  },
  "/assets/log-out-DvBtYfWU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e7-YRtruj+DYfRnTuk7b7okavsNM2o"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 231,
    "path": "../public/assets/log-out-DvBtYfWU.js"
  },
  "/assets/map-pin-CmRfEOtI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ff-3MB4R8nn8VGmb/HlSUQ7lEOp214"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 255,
    "path": "../public/assets/map-pin-CmRfEOtI.js"
  },
  "/assets/mail-B2wA98ai.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d6-Yx9mWgDPN0IMbvSBxqmUghn7sZE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 214,
    "path": "../public/assets/mail-B2wA98ai.js"
  },
  "/assets/maintenance-t3QF2F8K.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8b5-5tfTIbsrwHbDEHyY2tatHGRhw7c"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 2229,
    "path": "../public/assets/maintenance-t3QF2F8K.js"
  },
  "/assets/my-requests-B1U8eMzW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d39-t2UWhXkfGpfrjqcZ4hRwNFyPrmg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 3385,
    "path": "../public/assets/my-requests-B1U8eMzW.js"
  },
  "/assets/message-square-B1B9eg_4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ea-RZaRdx+/L5mc/OPyRwFdaqP/NUM"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 234,
    "path": "../public/assets/message-square-B1B9eg_4.js"
  },
  "/assets/megaphone-z9yHxF2T.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"15b-+q8u6AGEbxOJ6jBN74nsA169i5w"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 347,
    "path": "../public/assets/megaphone-z9yHxF2T.js"
  },
  "/assets/notifications.functions-BXtMBeq8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"230-fGbtrbM7ks6wxR9Mh3pUJwfqdOs"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 560,
    "path": "../public/assets/notifications.functions-BXtMBeq8.js"
  },
  "/assets/phone-DiQ_-MUA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"214-g40iGFEh/TAAgSNDIOqtpsi5rd8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 532,
    "path": "../public/assets/phone-DiQ_-MUA.js"
  },
  "/assets/project-approval.functions-DFy3XK_S.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"333-c3G1gR0ih2v8knIF9trqNMn+KwE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 819,
    "path": "../public/assets/project-approval.functions-DFy3XK_S.js"
  },
  "/assets/plus-Cec_Xgkx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9a-owKvuC1bgutFJmK6d9lvgMjmzPc"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 154,
    "path": "../public/assets/plus-Cec_Xgkx.js"
  },
  "/assets/project-hospital-C03d0OVK.jpg": {
    "type": "image/jpeg",
    "etag": '"1cb3f-fkgVm4TncAE99hHKgO1o8YJnXYo"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 117567,
    "path": "../public/assets/project-hospital-C03d0OVK.jpg"
  },
  "/assets/project-bridge-CEy5d9F2.jpg": {
    "type": "image/jpeg",
    "etag": '"1e430-DsBDlKUCyzQ8t+Yq/SzY/YbgCmI"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 123952,
    "path": "../public/assets/project-bridge-CEy5d9F2.jpg"
  },
  "/assets/project-mall-C2poXo39.jpg": {
    "type": "image/jpeg",
    "etag": '"27b59-fV6rtxyH26q/FjFq15zw/R8z4c8"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 162649,
    "path": "../public/assets/project-mall-C2poXo39.jpg"
  },
  "/assets/project-school-ByfoLf-l.jpg": {
    "type": "image/jpeg",
    "etag": '"203ae-C/WwBhDqNHOZ7QDg/oO/TVHmVk0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 132014,
    "path": "../public/assets/project-school-ByfoLf-l.jpg"
  },
  "/assets/project._id-DbqhV8AX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2700-ikNnO6x/Z9/s71JbnsFFT7X0hdI"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 9984,
    "path": "../public/assets/project._id-DbqhV8AX.js"
  },
  "/assets/project-tower-CY4UtbFp.jpg": {
    "type": "image/jpeg",
    "etag": '"2fdc6-uYw48yXkKFuV1+Kpdo0+fV8JD7c"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 196038,
    "path": "../public/assets/project-tower-CY4UtbFp.jpg"
  },
  "/assets/project-villa-1KGCCkeh.jpg": {
    "type": "image/jpeg",
    "etag": '"2bc17-wDpnIyMZm6M3KaDQy0kW5It3154"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 179223,
    "path": "../public/assets/project-villa-1KGCCkeh.jpg"
  },
  "/assets/projects-BNlTpPQD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2ae8-rJpogMiyAm+l8mO6u7jR64K+3z4"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 10984,
    "path": "../public/assets/projects-BNlTpPQD.js"
  },
  "/assets/projects-DdA7GROd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"32b-ygdpsE5G54h/vvXn6N7idhYt+g4"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 811,
    "path": "../public/assets/projects-DdA7GROd.js"
  },
  "/assets/reset-password-CSRkt05J.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1083-EzJqcCCiT/zjtkJCn+2RdKaTA7g"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 4227,
    "path": "../public/assets/reset-password-CSRkt05J.js"
  },
  "/assets/route-0LZCu0E1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f-h0/6yPoLylD2O7TexMTVT5eAiDU"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 95,
    "path": "../public/assets/route-0LZCu0E1.js"
  },
  "/assets/refresh-cw-DmqeOual.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"142-tWjFY5m+NC5VPCw58odeIqzDBuY"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 322,
    "path": "../public/assets/refresh-cw-DmqeOual.js"
  },
  "/assets/save-CwleQstP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"148-Zo1Vxys7mHrDhuB6gTz+l1Bnz+A"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 328,
    "path": "../public/assets/save-CwleQstP.js"
  },
  "/assets/search-DA4KSHX-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"aa-vGS3tqHMG0nkmS6WQNcpwnShKkg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 170,
    "path": "../public/assets/search-DA4KSHX-.js"
  },
  "/assets/select-DuJeIj8E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"deea-9bd23WcazDqjb+5e6EusjIuAxjk"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 57066,
    "path": "../public/assets/select-DuJeIj8E.js"
  },
  "/assets/site-footer-CaYMDBS5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"175-NxdzVvsl4Ddo36u0NhlatEfAvYg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 373,
    "path": "../public/assets/site-footer-CaYMDBS5.js"
  },
  "/assets/share-2-D1Qvoaji.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"245-W1KjfoA+YfQET4d+gBQtgv/3KnY"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 581,
    "path": "../public/assets/share-2-D1Qvoaji.js"
  },
  "/assets/settings-2-D0EvTCXr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f8-qfdKOU2upio+HaXmN1MqhvUufwc"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 248,
    "path": "../public/assets/settings-2-D0EvTCXr.js"
  },
  "/assets/site-header-CkK9urYE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1682-noNG2VuG1puBrBmXM0uW2XUAmTw"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 5762,
    "path": "../public/assets/site-header-CkK9urYE.js"
  },
  "/assets/sonner-CC2RqGWg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"215-kpsliHx5Loj7WuAPPJH8wrkkbRE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 533,
    "path": "../public/assets/sonner-CC2RqGWg.js"
  },
  "/assets/subscribe-success-DdtBjPC0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"557-f7Vs+bcfgrsWAwwVHJHZLfGP1og"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 1367,
    "path": "../public/assets/subscribe-success-DdtBjPC0.js"
  },
  "/assets/star-7da94jyT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1d9-e4ePiVZa/WMuqnC9aNwLAR/sAVk"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 473,
    "path": "../public/assets/star-7da94jyT.js"
  },
  "/assets/styles-D_-b-Qul.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"1a812-5ij7mLi3ScF/tmI+SMJKO+dumFo"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 108562,
    "path": "../public/assets/styles-D_-b-Qul.css"
  },
  "/assets/table-DgT8c1w0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"63b-YP1ViaRxRiZ0X9D+IEBL5yfor9M"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 1595,
    "path": "../public/assets/table-DgT8c1w0.js"
  },
  "/assets/thank-you-C0ceJdqq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"55d-Z1rnzSBqFACtJjY+/zE1lBQt3eg"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 1373,
    "path": "../public/assets/thank-you-C0ceJdqq.js"
  },
  "/assets/trash-2-2V3exhJ4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-NN9fCG+6JWJclGkUfZdkEG00NRs"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 329,
    "path": "../public/assets/trash-2-2V3exhJ4.js"
  },
  "/assets/unsubscribe-CLifa68A.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"727-MT0Bx74tK8gfOXMruAyE0+5OTAk"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 1831,
    "path": "../public/assets/unsubscribe-CLifa68A.js"
  },
  "/assets/upload-BfIDGp6S.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a7d-gZthPh9snYoKUO5SLQxIhecTjm0"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 2685,
    "path": "../public/assets/upload-BfIDGp6S.js"
  },
  "/assets/upload-ChBsNqaE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e7-rVKTTmNDkG62ePJ+fHS6iV8GrTw"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 231,
    "path": "../public/assets/upload-ChBsNqaE.js"
  },
  "/assets/useMutation-BJOaaIp4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8a2-VM8h5guV01cNRnFqmo/13K3+EJw"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 2210,
    "path": "../public/assets/useMutation-BJOaaIp4.js"
  },
  "/assets/user-BcTf5br-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c0-I3nIRRi/KNm+3APsVeetR9fIxhE"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 192,
    "path": "../public/assets/user-BcTf5br-.js"
  },
  "/assets/user-plus-DFTCaRx5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"137-cl4/v1w5q5Wtpx/mtCdy/iimm/4"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 311,
    "path": "../public/assets/user-plus-DFTCaRx5.js"
  },
  "/assets/users-C1GzPYK1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"133-FCT6pNWqH5hwl1y/dW491uC4x4w"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 307,
    "path": "../public/assets/users-C1GzPYK1.js"
  },
  "/assets/vip.index-C9sTKNdO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4372-lVIfzoBBb69A4eR3sJOQyLn+yb4"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 17266,
    "path": "../public/assets/vip.index-C9sTKNdO.js"
  },
  "/assets/wrench-VBgTEt74.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"12b-FBRhkIRNKBugZn8An9GXVHj5O+M"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 299,
    "path": "../public/assets/wrench-VBgTEt74.js"
  },
  "/assets/vip-Dbw7zNn4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f-h0/6yPoLylD2O7TexMTVT5eAiDU"',
    "mtime": "2026-09-09T11:44:34.235Z",
    "size": 95,
    "path": "../public/assets/vip-Dbw7zNn4.js"
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
const _lazy_C9BbYE = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_C9BbYE };
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
