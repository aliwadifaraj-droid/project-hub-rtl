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
  "/assets/Combination-fZxk5wHG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"77a1-89iZsDjLRKIu7snUwt5GRLDKc1Q"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 30625,
    "path": "../public/assets/Combination-fZxk5wHG.js"
  },
  "/assets/admin-project-status-C9LQb22M.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8fe-H1vadMIULBMMq0G+cloI47NEH8w"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2302,
    "path": "../public/assets/admin-project-status-C9LQb22M.js"
  },
  "/assets/admin-DB5kZqdl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d49-H8od9USov6pKYx7j9AXuwsu+2M8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 11593,
    "path": "../public/assets/admin-DB5kZqdl.js"
  },
  "/assets/admin.bot-test-dZvPJws1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"17e9-SWRx7yzuql0NagKTJYoEAI4JX84"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 6121,
    "path": "../public/assets/admin.bot-test-dZvPJws1.js"
  },
  "/assets/admin.ads-B__9KFOB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10ff-zZv25wdu228ZdgETDH38jw9RzYs"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 4351,
    "path": "../public/assets/admin.ads-B__9KFOB.js"
  },
  "/assets/admin.bot-settings-7Cygkz2h.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1ec2-pBj3LdyW/nxm5JVxc4FSFBJm+94"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 7874,
    "path": "../public/assets/admin.bot-settings-7Cygkz2h.js"
  },
  "/assets/admin.employees-DmAwiTuz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"127a-34eNnqZpvNLQjtF9Vl5afsMshUo"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 4730,
    "path": "../public/assets/admin.employees-DmAwiTuz.js"
  },
  "/assets/admin.chat-DoIB2IzA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"125b-W7Sx9OvuInCL/luTSPt7B6LrGLU"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 4699,
    "path": "../public/assets/admin.chat-DoIB2IzA.js"
  },
  "/assets/admin.bot-training-DRCRuUCL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1e61-B1YUc51aaG5ru63yBv681Tw+4VM"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 7777,
    "path": "../public/assets/admin.bot-training-DRCRuUCL.js"
  },
  "/assets/admin.exclusivity-B3nQJ4Rz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1757-iZlOD1vuVOvKXGY65/dTb/2Sqtw"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 5975,
    "path": "../public/assets/admin.exclusivity-B3nQJ4Rz.js"
  },
  "/assets/admin.offers-BIkjo88X.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"dea-b3NvKQtq4BJ7yrZeN+FEcFcpAd0"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 3562,
    "path": "../public/assets/admin.offers-BIkjo88X.js"
  },
  "/assets/admin.messages-D4rtf58F.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3d93-Z9rP57unPn62nZm+dIUcw+66RIY"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 15763,
    "path": "../public/assets/admin.messages-D4rtf58F.js"
  },
  "/assets/admin.pending-projects-Du82p398.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c33-0ed0nU78Vsw0+dj3T8VifBwrW9k"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 3123,
    "path": "../public/assets/admin.pending-projects-Du82p398.js"
  },
  "/assets/admin.my-projects-DA1Es5xE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e4d-s2/bgIoyoxN4LNyCnCkhB2xvQKc"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 3661,
    "path": "../public/assets/admin.my-projects-DA1Es5xE.js"
  },
  "/assets/admin.groq-settings-Q1HMpxp-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"176a-lT7YCuuCbRyQA0812lz4Stij2sw"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 5994,
    "path": "../public/assets/admin.groq-settings-Q1HMpxp-.js"
  },
  "/assets/admin.requests-zM27uPQ1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4ce3-CBKocGOBXjkzIwfuYLSrsssmj5A"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 19683,
    "path": "../public/assets/admin.requests-zM27uPQ1.js"
  },
  "/assets/admin.projects-Cv307fop.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"30a2-s0k2BrwX9RgkYhqz23j7eJdEVGQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 12450,
    "path": "../public/assets/admin.projects-Cv307fop.js"
  },
  "/assets/admin.support-CgHoVNk-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1642-8c2xrawnJQ5n8UA7gd9hjqs/Ae4"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 5698,
    "path": "../public/assets/admin.support-CgHoVNk-.js"
  },
  "/assets/admin.settings-D8KEJJf2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3bd7-ZBlppT+18PzGp2441aPO+iQX3XY"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 15319,
    "path": "../public/assets/admin.settings-D8KEJJf2.js"
  },
  "/assets/ads-D1Sjtwbr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7dd-+HVjQu6XUoUyL0EDfX+/TuMiIs0"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2013,
    "path": "../public/assets/ads-D1Sjtwbr.js"
  },
  "/assets/admin.users-B5HhC-vz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b85-T8ObYVxNoTaQ5XNJGN2NNy2Gkic"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2949,
    "path": "../public/assets/admin.users-B5HhC-vz.js"
  },
  "/assets/admin.vip-X3a4Hfq4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"243a-Y22ybEjjaQ1AmMdgIWH146mk2lo"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 9274,
    "path": "../public/assets/admin.vip-X3a4Hfq4.js"
  },
  "/assets/ads._adId-Beav92C6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"109-QReaV0HJxJ28Pk+6oVFr62sxwFk"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 265,
    "path": "../public/assets/ads._adId-Beav92C6.js"
  },
  "/assets/ads._adId-CqVIFALD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1430-AHaARHUvrl59NQ9EURuELh5GhLA"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 5168,
    "path": "../public/assets/ads._adId-CqVIFALD.js"
  },
  "/assets/ads._adId-_1kI5om4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f0-7+jdDo1A2WwqU5site1gq2X4rko"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 240,
    "path": "../public/assets/ads._adId-_1kI5om4.js"
  },
  "/assets/arrow-right-D42FIN3E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a6-EP5nv7J7Efe2ab3LtA4UjDqB6nE"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 166,
    "path": "../public/assets/arrow-right-D42FIN3E.js"
  },
  "/assets/bell-DvqQtMYB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"123-zUlzNnJnxgjXr/ue8QIQ6EcpWJI"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 291,
    "path": "../public/assets/bell-DvqQtMYB.js"
  },
  "/assets/auth-CVkQcX_R.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8f-QV5tqJ/ry9aAp67MQV8oCx+DamI"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 3727,
    "path": "../public/assets/auth-CVkQcX_R.js"
  },
  "/assets/blocked.functions-C6X2wImg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"23c-iHNEKjwDbcX76hE0BwAw+FBYEUM"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 572,
    "path": "../public/assets/blocked.functions-C6X2wImg.js"
  },
  "/assets/bot-BqkpvFKh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-GDm87ghhrUDm8J/6DZqCwl6NTC0"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 329,
    "path": "../public/assets/bot-BqkpvFKh.js"
  },
  "/assets/check-k7I16U76.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"78-yzT3ARdgvzEpzGiKqNk7RU8fg0g"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 120,
    "path": "../public/assets/check-k7I16U76.js"
  },
  "/assets/building-2-Se00n4bP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"180-WWKkuyHTho06GjRRJDUDDkfH2jo"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 384,
    "path": "../public/assets/building-2-Se00n4bP.js"
  },
  "/assets/chat.functions-B3LovtUC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3e9-ayIOSeD5+ldTx7Yd7/XusfdusA0"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 1001,
    "path": "../public/assets/chat.functions-B3LovtUC.js"
  },
  "/assets/chevron-down-DYG8kGYw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"81-swcRZfkTHsN7Bq15bXNjhKAToSM"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 129,
    "path": "../public/assets/chevron-down-DYG8kGYw.js"
  },
  "/assets/clock-BU2jAHin.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a5-VTeJ4BO4igwAe3jgMzDSe5Mib3w"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 165,
    "path": "../public/assets/clock-BU2jAHin.js"
  },
  "/assets/file-down-Yjs6v7rK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"164-6eMqg64u11lySJLPkhvsjRIsSqc"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 356,
    "path": "../public/assets/file-down-Yjs6v7rK.js"
  },
  "/assets/contact-DR7lFav3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"debc-gt8OxIFQamZ4YWM0hzY+EBJpD9o"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 57020,
    "path": "../public/assets/contact-DR7lFav3.js"
  },
  "/assets/copy-BTYDT3_y.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8-Ssg2BIdjmFeBZj0C87CK6o1uwao"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 232,
    "path": "../public/assets/copy-BTYDT3_y.js"
  },
  "/assets/files.functions-B3NAkpEQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2dd-Koasvw0rgBuQDlr8W2p4lg10Ap8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 733,
    "path": "../public/assets/files.functions-B3NAkpEQ.js"
  },
  "/assets/forgot-password-l54TJUN0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a8d-4DmODTVuFimCQlWlXRex1FHUkuI"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2701,
    "path": "../public/assets/forgot-password-l54TJUN0.js"
  },
  "/assets/folder-kanban-xsB6Naoz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"15e-lXY0b8iIVn9C5REAzWhPx2mRtv4"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 350,
    "path": "../public/assets/folder-kanban-xsB6Naoz.js"
  },
  "/assets/index-C5-iFl0L.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"cc0-gdCoUJ75Dw5OSJEBAKMaGT/twdo"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 3264,
    "path": "../public/assets/index-C5-iFl0L.js"
  },
  "/assets/index-CSpedCEx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"80c6-g69p/0oDalVw5hmmAUOihEhL4Eg"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 32966,
    "path": "../public/assets/index-CSpedCEx.js"
  },
  "/assets/loader-circle-Bi-IR6Ft.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8c-VCUqpF96gDWIr3/FHmaM0l1VnlY"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 140,
    "path": "../public/assets/loader-circle-Bi-IR6Ft.js"
  },
  "/assets/lock-CaB-qJtY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ca-UsiZ2qdaQoqPRLH8v7x1PQkRpRU"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 202,
    "path": "../public/assets/lock-CaB-qJtY.js"
  },
  "/assets/mail-CaaMmF30.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d6-CU3f6v1pf88IiGVB6blvLyLNIx8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 214,
    "path": "../public/assets/mail-CaaMmF30.js"
  },
  "/assets/maintenance-Dg15TkVl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8b5-sXMz9xNsnDlMXUwiqADhYIj5h18"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2229,
    "path": "../public/assets/maintenance-Dg15TkVl.js"
  },
  "/assets/label-kyO0lzgg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"463-FrgNit7hR2z6o8zSYuHxR6sPw3o"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 1123,
    "path": "../public/assets/label-kyO0lzgg.js"
  },
  "/assets/index-D7d-vEo_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"86ae-lZIwqn6FSm5H9E5OR7FakE/Vys8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 34478,
    "path": "../public/assets/index-D7d-vEo_.js"
  },
  "/assets/index-BZhU153J.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"64b62-1oq8NmcT93j+fHj7dHj4p/gY6Sg"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 412514,
    "path": "../public/assets/index-BZhU153J.js"
  },
  "/assets/map-pin-BxyOomtD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ff-O+pR1n+IuCLq9a/f7t2Hp1dVVuM"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 255,
    "path": "../public/assets/map-pin-BxyOomtD.js"
  },
  "/assets/message-square-BRfD3Jji.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ea-2wWV8yHc/SVyQ99OnIfME1oBNXk"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 234,
    "path": "../public/assets/message-square-BRfD3Jji.js"
  },
  "/assets/megaphone-sr3Vn5LQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"15b-PIFVJJtHHQl+eTVsGW53y/9q8o4"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 347,
    "path": "../public/assets/megaphone-sr3Vn5LQ.js"
  },
  "/assets/my-requests-H_AzKW8X.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d55-syLvIf8CznMo0euqG4IhnjNNGpk"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 3413,
    "path": "../public/assets/my-requests-H_AzKW8X.js"
  },
  "/assets/plus-7nxrQuMN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9a-L/EX3hoAmVb9AvNgw72P8511Hlo"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 154,
    "path": "../public/assets/plus-7nxrQuMN.js"
  },
  "/assets/notifications.functions-aa9sQ6n9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"396-TQ7VtDMmT7PXvHQXXvFh2vcR+kc"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 918,
    "path": "../public/assets/notifications.functions-aa9sQ6n9.js"
  },
  "/assets/project-bridge-CEy5d9F2.jpg": {
    "type": "image/jpeg",
    "etag": '"1e430-DsBDlKUCyzQ8t+Yq/SzY/YbgCmI"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 123952,
    "path": "../public/assets/project-bridge-CEy5d9F2.jpg"
  },
  "/assets/project-approval.functions-Bj9JoTqy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"333-jnpop5H1/o5tZkKFA1WonAxpWds"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 819,
    "path": "../public/assets/project-approval.functions-Bj9JoTqy.js"
  },
  "/assets/project-mall-C2poXo39.jpg": {
    "type": "image/jpeg",
    "etag": '"27b59-fV6rtxyH26q/FjFq15zw/R8z4c8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 162649,
    "path": "../public/assets/project-mall-C2poXo39.jpg"
  },
  "/assets/project-hospital-C03d0OVK.jpg": {
    "type": "image/jpeg",
    "etag": '"1cb3f-fkgVm4TncAE99hHKgO1o8YJnXYo"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 117567,
    "path": "../public/assets/project-hospital-C03d0OVK.jpg"
  },
  "/assets/project-school-ByfoLf-l.jpg": {
    "type": "image/jpeg",
    "etag": '"203ae-C/WwBhDqNHOZ7QDg/oO/TVHmVk0"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 132014,
    "path": "../public/assets/project-school-ByfoLf-l.jpg"
  },
  "/assets/project._id-CA2CrmRS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"26e0-T086PBn9E2+0nfyXxNSppP2oxqY"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 9952,
    "path": "../public/assets/project._id-CA2CrmRS.js"
  },
  "/assets/projects-0GN0FL4a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d8-UPGB9BghcWizgt+KnJD12vLRoHY"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 728,
    "path": "../public/assets/projects-0GN0FL4a.js"
  },
  "/assets/project-tower-CY4UtbFp.jpg": {
    "type": "image/jpeg",
    "etag": '"2fdc6-uYw48yXkKFuV1+Kpdo0+fV8JD7c"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 196038,
    "path": "../public/assets/project-tower-CY4UtbFp.jpg"
  },
  "/assets/projects-NhCkOBAT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2aec-+RXZg0D4KBG6gYD4v0e9EIEu0WQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 10988,
    "path": "../public/assets/projects-NhCkOBAT.js"
  },
  "/assets/project-villa-1KGCCkeh.jpg": {
    "type": "image/jpeg",
    "etag": '"2bc17-wDpnIyMZm6M3KaDQy0kW5It3154"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 179223,
    "path": "../public/assets/project-villa-1KGCCkeh.jpg"
  },
  "/assets/route-BuyTG-n8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f-HHKhbM/XgYw1KF4ZFIjvKobljzs"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 95,
    "path": "../public/assets/route-BuyTG-n8.js"
  },
  "/assets/refresh-cw-Ixy8x025.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"142-0FV8AcV+3O1gbv+P1+QER8u57yQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 322,
    "path": "../public/assets/refresh-cw-Ixy8x025.js"
  },
  "/assets/reset-password-BklAWA7q.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"fe5-ifRbr/INSOeYSSMkjJ9v6tLQnWI"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 4069,
    "path": "../public/assets/reset-password-BklAWA7q.js"
  },
  "/assets/settings-2-a4A1i06W.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f8-Hpu6W4BE7V3HYVEHsr2c9/eKHIQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 248,
    "path": "../public/assets/settings-2-a4A1i06W.js"
  },
  "/assets/select-Cs54ZBrD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"deea-nQys5L5kKsib0LFd9DAoWqcosEg"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 57066,
    "path": "../public/assets/select-Cs54ZBrD.js"
  },
  "/assets/share-2-C2NpKW_D.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"245-pNkBu9t3mfOhQOdIjS0VMBgNpeQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 581,
    "path": "../public/assets/share-2-C2NpKW_D.js"
  },
  "/assets/save-CjcBZPQk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"148-Y7etp5m9+in6zU1eNe7VinkT3FA"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 328,
    "path": "../public/assets/save-CjcBZPQk.js"
  },
  "/assets/search-C9Zf9gsM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"aa-q0P7Id+LNNmAbKX4k7vslrnUtXA"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 170,
    "path": "../public/assets/search-C9Zf9gsM.js"
  },
  "/assets/site-footer-KZCLY6sv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"175-U1OpC/6fl47fEqZJR0uTSh0KEBE"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 373,
    "path": "../public/assets/site-footer-KZCLY6sv.js"
  },
  "/assets/site-header-BZ_cscR1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"13fa-pophU3Ics3g5yJUiGbTzcTeeEb8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 5114,
    "path": "../public/assets/site-header-BZ_cscR1.js"
  },
  "/assets/sonner-ByhJRv3V.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"215-Qk3ZcNOhVFlFWY4oRNVyRSesOPk"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 533,
    "path": "../public/assets/sonner-ByhJRv3V.js"
  },
  "/assets/styles-Dn6NL99h.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"182b3-qqhuEUSdHM3UHzepuhzNOh3Lpr4"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 98995,
    "path": "../public/assets/styles-Dn6NL99h.css"
  },
  "/assets/star-BQLBphGy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1d9-k1BmSQV8CXytLIY0ZTxUMFUbPAw"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 473,
    "path": "../public/assets/star-BQLBphGy.js"
  },
  "/assets/subscribe-success-C2mdEDJS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"532-T8yipw+hVi0f5NvqNjoyBB22vi4"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 1330,
    "path": "../public/assets/subscribe-success-C2mdEDJS.js"
  },
  "/assets/thank-you-CpvMb6bD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"538-fU6jha3OdD7A5Oeq9lviub6JS/Y"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 1336,
    "path": "../public/assets/thank-you-CpvMb6bD.js"
  },
  "/assets/trash-2-CFw86wc-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-ORkigjI2iFPL54vK6K2E5VedUXQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 329,
    "path": "../public/assets/trash-2-CFw86wc-.js"
  },
  "/assets/table-B87Z9m5f.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"63b-Xa1RciSIGKmquMcn33O58NEgQL4"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 1595,
    "path": "../public/assets/table-B87Z9m5f.js"
  },
  "/assets/upload-BTq5BJRg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e7-FGud3QVenA/g3h7Ez+43VzclMrA"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 231,
    "path": "../public/assets/upload-BTq5BJRg.js"
  },
  "/assets/unsubscribe-5HzIUB3h.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"727-NhqOpeXRkUXTlzIqcePpKJp8/T0"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 1831,
    "path": "../public/assets/unsubscribe-5HzIUB3h.js"
  },
  "/assets/upload-BgC4q7iI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a7d-u4bLhIF0IpTzeJ+n4BV4k1vt6ys"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2685,
    "path": "../public/assets/upload-BgC4q7iI.js"
  },
  "/assets/vip-CIA31KVu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5f-HHKhbM/XgYw1KF4ZFIjvKobljzs"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 95,
    "path": "../public/assets/vip-CIA31KVu.js"
  },
  "/assets/useMutation-BIPGmiYV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8a2-MgVA9r8Svpj8PkMimZDKfl91O1w"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 2210,
    "path": "../public/assets/useMutation-BIPGmiYV.js"
  },
  "/assets/user-B4_O18pY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c0-KhLqRd329Pln384UGzOXXNLkIjE"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 192,
    "path": "../public/assets/user-B4_O18pY.js"
  },
  "/assets/vip.index-fh04B8Z4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3741-x2koSNOrNoobp6Gs1CDpqAb5M/8"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 14145,
    "path": "../public/assets/vip.index-fh04B8Z4.js"
  },
  "/assets/wrench-DhALu_Op.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"12b-lbWwPhOsQ0hT0inoq4VW2nIA3hQ"',
    "mtime": "2026-08-23T02:07:37.190Z",
    "size": 299,
    "path": "../public/assets/wrench-DhALu_Op.js"
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
