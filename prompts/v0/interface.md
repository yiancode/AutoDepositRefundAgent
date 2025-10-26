下面这几个接口，是我通过抓包工具charles分析出来的手机端获取项目打卡信息，打卡排行榜的接口，请求包含url和curl两个链接，JSON返回结果包含Unicode转义字符,
-- 我需要你根据以下请求和响应的数据结构设计v0版本的数据模型和API。
## 全部打卡挑战，点击“打卡挑战”

### 进行中的打卡

1)请求

https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=ongoing&count=100

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761507257" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: 6178b8c8ee26c9b81fc1ecdec0db2216b0d3be81" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 62ef6c57-a8cd-47ee-ac57-fc61e2a2c1ae" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=ongoing&count=100"

2)响应

```
{
  "succeeded": true,
  "resp_data": {
    "checkins": [
      {
        "checkin_id": 2424424541,
        "group": {
          "group_id": 15555411412112,
          "name": "AI\\u79c1\\u57df\\u8d5a\\u94b1",
          "background_url": "https:\\/\\/images.zsxq.com\\/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 582884445452854,
          "name": "\\u6df1\\u5733\\u5927\\u51b2",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
          "description": "AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u4e3b\\u7406\\u4eba\\uff0c\\u9879\\u76ee\\u578b IP \\u5b75\\u5316\\u6559\\u7ec3\\uff0c\\u4e3b\\u4e1a\\u67b6\\u6784\\u5e08\\u3001\\u526f\\u4e1a\\u9500\\u51a0\\u64cd\\u76d8\\u624b\\u3001\\u526f\\u4e1a\\u9996\\u5e74\\u6536\\u5165\\u8d85\\u767e\\u4e07\\uff0c\\u4e00\\u4eba\\u4f01\\u4e1a\\u79c1\\u57df\\u793e\\u7fa4\\u5546\\u4e1a\\u5316\\u63a2\\u7d22\\u8005\\u3001\\u5927\\u51b2\\u5341\\u5e74\\u9000\\u4f11\\u8ba1\\u5212\\u53d1\\u8d77\\u4eba\\u3002"
        },
        "title": "2510 AI\\u5c0f\\u7eff\\u4e66\\u7206\\u6587",
        "text": "1\\u3001#AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u6253\\u5361\\u540e\\uff0c\\u4ee5\\u661f\\u7403\\u6253\\u5361\\u6b21\\u6570\\u4e3a\\u51c6\\uff0c\\u4e0d\\u5141\\u8bb8\\u6c34\\u5361\\u548c\\u6478\\u9c7c\\uff0c\\u8ba4\\u771f\\u6253\\u5361\\uff0c\\u5bf9\\u5f97\\u8d77\\u81ea\\u5df1\\u3002\n\n\\u6253\\u5361\\u4f60\\u5b66\\u4e60\\u7684\\u5185\\u5bb9\\uff0c\\u6210\\u679c\\uff0c\\u907f\\u5751\\uff0c\\u60f3\\u5206\\u4eab\\u7ed9\\u522b\\u4eba\\u7684\\u77e5\\u8bc6\\u7ecf\\u9a8c\\u6280\\u5de7\\uff0c\\u4e0e\\u672c\\u9879\\u76ee\\u6709\\u5173\\u7684\\u5185\\u5bb9\\u7b49\\u3002\n\n2\\u3001\\u9000\\u62bc\\u91d1\\u89c4\\u5219:\n\\u5b8c\\u62107\\u5929\\u6253\\u5361\\uff0c\\u62bc\\u91d139\\u5168\\u9000\\uff0c\\u672a\\u5b8c\\u62107\\u5929\\u6253\\u5361\\u6216\\u8005\\u6c34\\u5361\\u7684\\u62bc\\u91d1\\u4e0d\\u9000\\uff0c\\u6570\\u636e\\u4ee5\\u661f\\u7403\\u7684\\u7d2f\\u8ba1\\u6253\\u5361\\u6392\\u884c\\u699c\\u4e3a\\u51c6\\uff0c\\u622a\\u6b62\\u65e5\\u671f\\u4ee5\\u7fa4\\u516c\\u544a\\u7684\\u8bf4\\u660e\\u4e3a\\u51c6\\u3002\n\n3\\u3001\\u52a0\\u5927\\u51b2\\u5fae\\u4fe1:95017333\\u4ea4\\u62bc\\u91d139\\u5143\\u8fdb\\u7fa4\\u3002",
        "checkin_days": 9,
        "validity": {
          "long_period": false,
          "expiration_time": "2025-11-03T23:59:59.999+0800"
        },
        "show_topics_on_timeline": false,
        "create_time": "2025-10-25T06:54:53.309+0800",
        "status": "ongoing",
        "type": "accumulated",
        "joined_count": 115,
        "statistics": {
          "joined_count": 115,
          "completed_count": 0,
          "today_checkined_count": 2
        },
        "joined_users": [
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fr1Wa5ogbq615ukeK9N1YrzzNc8h?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:FcQXqRyPIW1TkK7_dApJ8t1_8pA="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fvqt2jdHEgXsk3Wh5qiCyXNPDqUF?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:3r4LrP1iKZZ1wu3-YNjr8RhNJLA="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FnnSQLk96IdI-TSM3G5hdKiVEi89?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:gQEaSn4D0hlJmablUU61BoarIw0="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FjuwRreje2tX4Di-4NiWBRu3xFNq?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:6AXvaL7mlIeY1s9Ql3jw2dy5CU4="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fntvm9u1d00VlC_ahAYfV6hDD7jN?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:wtG1Nzdsu7-rTqeaN_zOeGaj_Oc="
          }
        ],
        "user_specific": {
          "joined": false
        },
        "min_words_count": 30
      }
    ]
  }
}

```

### 已结束的打卡

1) 请求

https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=over&count=30

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761507257" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: b37c87a69fb745ad5323dbf2f4847b290850f4b9" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: a7235213-d7c8-400a-a961-0c29cb312365" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=over&count=30"

2) 响应

```
{
  "succeeded": true,
  "resp_data": {
    "checkins": [
      {
        "checkin_id": 8424481182,
        "group": {
          "group_id": 15555411412112,
          "name": "AI\\u79c1\\u57df\\u8d5a\\u94b1",
          "background_url": "https:\\/\\/images.zsxq.com\\/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 582884445452854,
          "name": "\\u6df1\\u5733\\u5927\\u51b2",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
          "description": "AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u4e3b\\u7406\\u4eba\\uff0c\\u9879\\u76ee\\u578b IP \\u5b75\\u5316\\u6559\\u7ec3\\uff0c\\u4e3b\\u4e1a\\u67b6\\u6784\\u5e08\\u3001\\u526f\\u4e1a\\u9500\\u51a0\\u64cd\\u76d8\\u624b\\u3001\\u526f\\u4e1a\\u9996\\u5e74\\u6536\\u5165\\u8d85\\u767e\\u4e07\\uff0c\\u4e00\\u4eba\\u4f01\\u4e1a\\u79c1\\u57df\\u793e\\u7fa4\\u5546\\u4e1a\\u5316\\u63a2\\u7d22\\u8005\\u3001\\u5927\\u51b2\\u5341\\u5e74\\u9000\\u4f11\\u8ba1\\u5212\\u53d1\\u8d77\\u4eba\\u3002"
        },
        "title": "2510 AI\\u5199\\u4f5c(\\u8f6f\\u4ef6\\u6587\\u6863)",
        "text": "1\\u3001#AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u6253\\u5361\\u540e\\uff0c\\u4ee5\\u661f\\u7403\\u6253\\u5361\\u6b21\\u6570\\u4e3a\\u51c6\\uff0c\\u4e0d\\u5141\\u8bb8\\u6c34\\u5361\\u548c\\u6478\\u9c7c\\uff0c\\u8ba4\\u771f\\u6253\\u5361\\uff0c\\u5bf9\\u5f97\\u8d77\\u81ea\\u5df1\\u3002\n\n\\u6253\\u5361\\u4f60\\u5b66\\u4e60\\u7684\\u5185\\u5bb9\\uff0c\\u6210\\u679c\\uff0c\\u907f\\u5751\\uff0c\\u60f3\\u5206\\u4eab\\u7ed9\\u522b\\u4eba\\u7684\\u77e5\\u8bc6\\u7ecf\\u9a8c\\u6280\\u5de7\\uff0c\\u4e0e\\u672c\\u9879\\u76ee\\u6709\\u5173\\u7684\\u5185\\u5bb9\\u7b49\\u3002\n\n2\\u3001\\u9000\\u62bc\\u91d1\\u89c4\\u5219\\uff1a\n\\u5b8c\\u62107\\u5929\\u6253\\u5361\\uff0c\\u62bc\\u91d139\\u5168\\u9000\\uff0c\\u672a\\u5b8c\\u62107\\u5929\\u6253\\u5361\\u6216\\u8005\\u6c34\\u5361\\u7684\\u62bc\\u91d1\\u4e0d\\u9000\\uff0c\\u6570\\u636e\\u4ee5\\u661f\\u7403\\u7684\\u7d2f\\u8ba1\\u6253\\u5361\\u6392\\u884c\\u699c\\u4e3a\\u51c6\\uff0c\\u622a\\u6b62\\u65e5\\u671f\\u4ee5\\u300c\\u9879\\u76ee\\u7fa4\\u516c\\u544a\\u300d\\u7684\\u8bf4\\u660e\\u4e3a\\u51c6\\u3002\n\n3\\u3001\\u52a0\\u5927\\u51b2\\u5fae\\u4fe1\\uff1a95017333\\u4ea4\\u62bc\\u91d139\\u5143\\u8fdb\\u7fa4\\u3002",
        "checkin_days": 9,
        "validity": {
          "long_period": false,
          "expiration_time": "2025-10-26T23:59:59.999+0800"
        },
        "show_topics_on_timeline": false,
        "create_time": "2025-10-17T19:43:42.339+0800",
        "status": "over",
        "type": "accumulated",
        "joined_count": 99,
        "statistics": {
          "joined_count": 99,
          "completed_count": 9,
          "today_checkined_count": 0
        },
        "joined_users": [
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FgA5EhIzQLYYi3vk2p2D5SrEQWNL?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:IUWHmLuem3VfNYX4HYnhnOhZy_8="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FvJvtOpK2PChh6GajurqeCQFayUQ?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Hi-1Zk-5uwkJgmIRe4n3xRdUt5g="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fi6JXuCV5KvxRL7OgI_ffy0O3MC-?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:j4TrfERawAPZSvU0VzjHbEwKAJM="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FkrDTgqrAuoDvbP9fyS9WK2CqZqL?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:bIbQ2RWJmKLLP09TJ2LZJQxS7_g="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FjwIzEH38ooTy1acVHpPPhMwDDVG?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:6ymAIYoCQsIW1XwgnX7jhOnJEDI="
          }
        ],
        "user_specific": {
          "joined": false
        },
        "min_words_count": 30
      },
      {
        "checkin_id": 8424485212,
        "group": {
          "group_id": 15555411412112,
          "name": "AI\\u79c1\\u57df\\u8d5a\\u94b1",
          "background_url": "https:\\/\\/images.zsxq.com\\/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 582884445452854,
          "name": "\\u6df1\\u5733\\u5927\\u51b2",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
          "description": "AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u4e3b\\u7406\\u4eba\\uff0c\\u9879\\u76ee\\u578b IP \\u5b75\\u5316\\u6559\\u7ec3\\uff0c\\u4e3b\\u4e1a\\u67b6\\u6784\\u5e08\\u3001\\u526f\\u4e1a\\u9500\\u51a0\\u64cd\\u76d8\\u624b\\u3001\\u526f\\u4e1a\\u9996\\u5e74\\u6536\\u5165\\u8d85\\u767e\\u4e07\\uff0c\\u4e00\\u4eba\\u4f01\\u4e1a\\u79c1\\u57df\\u793e\\u7fa4\\u5546\\u4e1a\\u5316\\u63a2\\u7d22\\u8005\\u3001\\u5927\\u51b2\\u5341\\u5e74\\u9000\\u4f11\\u8ba1\\u5212\\u53d1\\u8d77\\u4eba\\u3002"
        },
        "title": "2510 AI\\u7f16\\u7a0b",
        "text": "1\\u3001#AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u6253\\u5361\\u540e\\uff0c\\u4ee5\\u661f\\u7403\\u6253\\u5361\\u6b21\\u6570\\u4e3a\\u51c6\\uff0c\\u4e0d\\u5141\\u8bb8\\u6c34\\u5361\\u548c\\u6478\\u9c7c\\uff0c\\u8ba4\\u771f\\u6253\\u5361\\uff0c\\u5bf9\\u5f97\\u8d77\\u81ea\\u5df1\\u3002\n\n\\u6253\\u5361\\u4f60\\u5b66\\u4e60\\u7684\\u5185\\u5bb9\\uff0c\\u6210\\u679c\\uff0c\\u907f\\u5751\\uff0c\\u60f3\\u5206\\u4eab\\u7ed9\\u522b\\u4eba\\u7684\\u77e5\\u8bc6\\u7ecf\\u9a8c\\u6280\\u5de7\\uff0c\\u4e0e\\u672c\\u9879\\u76ee\\u6709\\u5173\\u7684\\u5185\\u5bb9\\u7b49\\u3002\n\n2\\u3001\\u9000\\u62bc\\u91d1\\u89c4\\u5219\\uff1a\n\\u5b8c\\u62107\\u5929\\u6253\\u5361\\uff0c\\u62bc\\u91d139\\u5168\\u9000\\uff0c\\u672a\\u5b8c\\u62107\\u5929\\u6253\\u5361\\u6216\\u8005\\u6c34\\u5361\\u7684\\u62bc\\u91d1\\u4e0d\\u9000\\uff0c\\u6570\\u636e\\u4ee5\\u661f\\u7403\\u7684\\u7d2f\\u8ba1\\u6253\\u5361\\u6392\\u884c\\u699c\\u4e3a\\u51c6\\uff0c\\u622a\\u6b62\\u65e5\\u671f\\u4ee5\\u300c\\u9879\\u76ee\\u7fa4\\u516c\\u544a\\u300d\\u7684\\u8bf4\\u660e\\u4e3a\\u51c6\\u3002\n\n3\\u3001\\u52a0\\u5927\\u51b2\\u5fae\\u4fe1\\uff1a95017333\\u4ea4\\u62bc\\u91d139\\u5143\\u8fdb\\u7fa4\\u3002",
        "checkin_days": 9,
        "validity": {
          "long_period": false,
          "expiration_time": "2025-10-18T23:59:59.999+0800"
        },
        "show_topics_on_timeline": false,
        "create_time": "2025-10-09T08:36:51.741+0800",
        "status": "over",
        "type": "accumulated",
        "joined_count": 75,
        "statistics": {
          "joined_count": 75,
          "completed_count": 8,
          "today_checkined_count": 0
        },
        "joined_users": [
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FmnMGb74_Wm4dVXmUWcFVuBdU2X9?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:DrZJsSPti0Q1AMc5GChvbqrkeSQ="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FuH4HMvS4qbwLb_iAbXtm6akWXQJ?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:ZF3iyEt-j_qGelUJB8y_wehOLlU="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fr_Ahlrqj7uEctsFq3VL-qEGCSzz?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Hc6YkBCcHf3yFucY7mNGb3JopXk="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FmCz5cqVofjYg1HsmqkJy1Idi46Q?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:9jukcLrLTBGdUFmtxZsnjROowfk="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FsqGg8toxMwT8ziPUJQE8sEzK8kY?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:0ecwM6HObMvz0UD2QWIlWZ6CSdE="
          }
        ],
        "user_specific": {
          "joined": false
        },
        "min_words_count": 30
      }
    ]
  }
}
```

### 已关闭的打卡

1）请求
https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=closed&count=30

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761507257" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: 43d5ffaba774a51f40a23434f16edd527bd80d9d" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 12e5b7b0-1c1a-46ca-bc86-e0ceb534606e" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=closed&count=30"

2）响应
```
{
  "succeeded": true,
  "resp_data": {
    "checkins": [
      {
        "checkin_id": 1141425812,
        "group": {
          "group_id": 15555411412112,
          "name": "AI\\u79c1\\u57df\\u8d5a\\u94b1",
          "background_url": "https:\\/\\/images.zsxq.com\\/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 28248815485121,
          "name": "\\u6df1\\u5733\\u8001\\u6613",
          "alias": "\\u6df1\\u5733\\u8001\\u6613",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FmxHUIwoaOBEYL-RPqv36m4rpi0u?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:ud-NemaLyz2f-K0jC6KfDCg2TTU="
        },
        "title": "2509 \\u5c0f\\u7ea2\\u4e66\\u865a\\u62df\\u7535\\u5546\\u4e0e\\u8d44\\u6599\\u5f15\\u6d41",
        "text": "1\\u3001#AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u6253\\u5361\\u540e\\uff0c\\u4ee5\\u661f\\u7403\\u6b21\\u6570\\u6253\\u5361\\u4e3a\\u51c6\\uff0c\\u4e0d\\u5141\\u8bb8\\u6c34\\u5361\\u548c\\u6478\\u9c7c\\uff0c\\u8ba4\\u771f\\u6253\\u5361\\uff0c\\u5bf9\\u5f97\\u8d77\\u81ea\\u5df1\\u3002\n\n\\u6253\\u5361\\u4f60\\u5b66\\u4e60\\u7684\\u5185\\u5bb9\\uff0c\\u6210\\u679c\\uff0c\\u907f\\u5751\\uff0c\\u60f3\\u5206\\u4eab\\u7ed9\\u522b\\u4eba\\u7684\\u77e5\\u8bc6\\u7ecf\\u9a8c\\u6280\\u5de7\\uff0c\\u4e0e\\u672c\\u9879\\u76ee\\u6709\\u5173\\u7684\\u5185\\u5bb9\\u7b49\\u3002\n\n2\\u3001\\u9000\\u62bc\\u91d1\\u89c4\\u5219\\uff1a\n\\u5b8c\\u621010\\u5929\\u6253\\u5361\\uff0c\\u62bc\\u91d139\\u5168\\u9000\\uff0c\\u672a\\u5b8c\\u621010\\u5929\\u6253\\u5361\\u6216\\u8005\\u6c34\\u5361\\u7684\\u62bc\\u91d1\\u4e0d\\u9000\\uff0c\\u6570\\u636e\\u4ee5\\u661f\\u7403\\u7684\\u7d2f\\u8ba1\\u6253\\u5361\\u6392\\u884c\\u699c\\u4e3a\\u51c6\\uff0c\\u622a\\u6b62\\u65e5\\u671f\\u4ee5\\u7fa4\\u516c\\u544a\\u7684\\u8bf4\\u660e\\u4e3a\\u51c6\\u3002\n\n3\\u3001\\u52a0\\u5927\\u51b2\\u5fae\\u4fe1\\uff1a330517251\\u4ea4\\u62bc\\u91d139\\u5143\\u8fdb\\u7fa4\\u3002",
        "checkin_days": 21,
        "validity": {
          "long_period": false,
          "expiration_time": "2025-09-22T23:59:59.999+0800"
        },
        "show_topics_on_timeline": false,
        "create_time": "2025-09-01T10:25:44.085+0800",
        "status": "closed",
        "type": "accumulated",
        "joined_count": 229,
        "statistics": {
          "joined_count": 229,
          "completed_count": 2,
          "today_checkined_count": 0
        },
        "joined_users": [
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FkojEV_eWaWJe45riK4zjVlXVsOC?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:etiji5taS-AQq91_7fXUc7sdGsY="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FnAiHiCIkPZuG2jvvfXXqdcZEN3x?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:eM1bOR_VeTThTRi0JAelqS7KXHk="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fv5L9xSdh7ykeUG5Bfl6mOp2VxsW?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:hmKBCWJRexS7ZG-mQymQrjv9fNc="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/FoA1-uBnpTIHNr19e_l3XCbixb0Q?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:eXAVpcij6fNA7A02oLl6hLd6XRE="
          },
          {
            "avatar_url": "https:\\/\\/images.zsxq.com\\/Fjnrf6uAWCbahHE7jc_t3JgXLTo9?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:WLhPzPfYNyDUf_0bGJ9TZwKo11s="
          }
        ],
        "user_specific": {
          "joined": false
        },
        "min_words_count": 30
      }
    ]
  }
}
```

## 查看打卡，点击“去查看”

### 查看打卡规则

1)请求

https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761508315" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: 2a7aab94de20aa32d66402a5b82bfc4cb771deaf" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 8e32d2b0-f2c2-413e-ac6f-eb2c74c529a9" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182"

2)响应

```
{
  "succeeded": true,
  "resp_data": {
    "is_valid_member": true,
    "checkin": {
      "checkin_id": 8424481182,
      "group": {
        "group_id": 15555411412112,
        "name": "AI\\u79c1\\u57df\\u8d5a\\u94b1",
        "background_url": "https:\\/\\/images.zsxq.com\\/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
      },
      "owner": {
        "user_id": 582884445452854,
        "name": "\\u6df1\\u5733\\u5927\\u51b2",
        "avatar_url": "https:\\/\\/images.zsxq.com\\/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
        "description": "AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u4e3b\\u7406\\u4eba\\uff0c\\u9879\\u76ee\\u578b IP \\u5b75\\u5316\\u6559\\u7ec3\\uff0c\\u4e3b\\u4e1a\\u67b6\\u6784\\u5e08\\u3001\\u526f\\u4e1a\\u9500\\u51a0\\u64cd\\u76d8\\u624b\\u3001\\u526f\\u4e1a\\u9996\\u5e74\\u6536\\u5165\\u8d85\\u767e\\u4e07\\uff0c\\u4e00\\u4eba\\u4f01\\u4e1a\\u79c1\\u57df\\u793e\\u7fa4\\u5546\\u4e1a\\u5316\\u63a2\\u7d22\\u8005\\u3001\\u5927\\u51b2\\u5341\\u5e74\\u9000\\u4f11\\u8ba1\\u5212\\u53d1\\u8d77\\u4eba\\u3002"
      },
      "title": "2510 AI\\u5199\\u4f5c(\\u8f6f\\u4ef6\\u6587\\u6863)",
      "text": "1\\u3001#AI\\u79c1\\u57df\\u8d5a\\u94b1\\u661f\\u7403\\u6253\\u5361\\u540e\\uff0c\\u4ee5\\u661f\\u7403\\u6253\\u5361\\u6b21\\u6570\\u4e3a\\u51c6\\uff0c\\u4e0d\\u5141\\u8bb8\\u6c34\\u5361\\u548c\\u6478\\u9c7c\\uff0c\\u8ba4\\u771f\\u6253\\u5361\\uff0c\\u5bf9\\u5f97\\u8d77\\u81ea\\u5df1\\u3002\n\n\\u6253\\u5361\\u4f60\\u5b66\\u4e60\\u7684\\u5185\\u5bb9\\uff0c\\u6210\\u679c\\uff0c\\u907f\\u5751\\uff0c\\u60f3\\u5206\\u4eab\\u7ed9\\u522b\\u4eba\\u7684\\u77e5\\u8bc6\\u7ecf\\u9a8c\\u6280\\u5de7\\uff0c\\u4e0e\\u672c\\u9879\\u76ee\\u6709\\u5173\\u7684\\u5185\\u5bb9\\u7b49\\u3002\n\n2\\u3001\\u9000\\u62bc\\u91d1\\u89c4\\u5219\\uff1a\n\\u5b8c\\u62107\\u5929\\u6253\\u5361\\uff0c\\u62bc\\u91d139\\u5168\\u9000\\uff0c\\u672a\\u5b8c\\u62107\\u5929\\u6253\\u5361\\u6216\\u8005\\u6c34\\u5361\\u7684\\u62bc\\u91d1\\u4e0d\\u9000\\uff0c\\u6570\\u636e\\u4ee5\\u661f\\u7403\\u7684\\u7d2f\\u8ba1\\u6253\\u5361\\u6392\\u884c\\u699c\\u4e3a\\u51c6\\uff0c\\u622a\\u6b62\\u65e5\\u671f\\u4ee5\\u300c\\u9879\\u76ee\\u7fa4\\u516c\\u544a\\u300d\\u7684\\u8bf4\\u660e\\u4e3a\\u51c6\\u3002\n\n3\\u3001\\u52a0\\u5927\\u51b2\\u5fae\\u4fe1\\uff1a95017333\\u4ea4\\u62bc\\u91d139\\u5143\\u8fdb\\u7fa4\\u3002",
      "checkin_days": 9,
      "validity": {
        "long_period": false,
        "expiration_time": "2025-10-26T23:59:59.999+0800"
      },
      "show_topics_on_timeline": false,
      "create_time": "2025-10-17T19:43:42.339+0800",
      "status": "over",
      "type": "accumulated",
      "joined_count": 99,
      "statistics": {
        "joined_count": 99,
        "completed_count": 9,
        "today_checkined_count": 0
      },
      "joined_users": [
        {
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FgA5EhIzQLYYi3vk2p2D5SrEQWNL?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:IUWHmLuem3VfNYX4HYnhnOhZy_8="
        },
        {
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FvJvtOpK2PChh6GajurqeCQFayUQ?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Hi-1Zk-5uwkJgmIRe4n3xRdUt5g="
        },
        {
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fi6JXuCV5KvxRL7OgI_ffy0O3MC-?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:j4TrfERawAPZSvU0VzjHbEwKAJM="
        },
        {
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FkrDTgqrAuoDvbP9fyS9WK2CqZqL?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:bIbQ2RWJmKLLP09TJ2LZJQxS7_g="
        },
        {
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FjwIzEH38ooTy1acVHpPPhMwDDVG?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:6ymAIYoCQsIW1XwgnX7jhOnJEDI="
        }
      ],
      "user_specific": {
        "joined": false
      },
      "min_words_count": 30
    },
    "group": {
      "name": "AI\\u79c1\\u57df\\u8d5a\\u94b1"
    }
  }
}

```

### 打卡排行榜：累计打卡榜

1)请求

https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182/ranking_list?type=accumulated&index=0

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761508323" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: fa46b7d9b5e7b478d0fcecabc86e3705494ae9cf" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 4d1b60bc-4fad-4180-a5c5-d3850882544c" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182/ranking_list?type=accumulated&index=0"

```
{
  "succeeded": true,
  "resp_data": {
    "ranking_list": [
      {
        "user": {
          "user_id": 88455815452182,
          "name": "\\u7403\\u7403\\u7684\\u526f\\u4e1a\\u63a2\\u7d22\\u8def",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fs-rw8bu107F3erUkXoQVISDtG-L?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Sa9P1KtL4br910MJTUD7G2dVKyo="
        },
        "rankings": 1,
        "checkined_days": 10
      },
      {
        "user": {
          "user_id": 118512224282822,
          "name": "Aaron",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fua_gW_cXWtfvk3L2nNHVvdrI3eV?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:3HNXuo4twCc9UAPuQVioi8Sq4pI="
        },
        "rankings": 2,
        "checkined_days": 10
      },
      {
        "user": {
          "user_id": 215854811822181,
          "name": "\\u5411\\u9633",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FrppxYGSg2czsYkHA_8VzOVUdy7T?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:mCa_iqwWX9gmibvy6yrLXi5pbto="
        },
        "rankings": 3,
        "checkined_days": 10
      },
      {
        "user": {
          "user_id": 548841115125224,
          "name": "Catherine",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FvRPfdCd3riB42bO2yYJkJ53FZWD?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:K-BHeN3sKGI1uM_3xh8ZNgHkJos="
        },
        "rankings": 4,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 818512125281152,
          "name": "\\u4e24\\u4e2a\\u4fe9",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FjYEuVulrMoWWuFCXqY7uZPKeG9p?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:A0JJPGdVqX5qUOC3YNSl1jkB46U="
        },
        "rankings": 5,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 15548451211212,
          "name": "\\u6728\\u9c7c\\u975e\\u96f6",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FhBicEcyzkJ478KBRV47d3Uk2x9h?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:fujJhkk_u7B4NxG_KC2ljxyCI5g="
        },
        "rankings": 6,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 412452582824828,
          "name": "\\u6bb7\\u7d2b\\u4e1c",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FmCz5cqVofjYg1HsmqkJy1Idi46Q?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:9jukcLrLTBGdUFmtxZsnjROowfk="
        },
        "rankings": 7,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 88512124218122,
          "name": "\\u58ee\\u58ee0928",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FnBTybznTT1YluVs2Zwy7XTQH5dN?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:jwEQUxZ5fhHOpFuB-vxwfgO4S1o="
        },
        "rankings": 8,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 15411425221212,
          "name": "\\u523a\\u5ba2",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FpiwxF7N2kwM9KMTuDCDBOeblvas?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:n81qOWEG-5Zz9Y76WxG_mOMUFBM="
        },
        "rankings": 9,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 4252115258,
          "name": "\\u4e07\\u7269\\u82cf",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fs0NRQi99F_k7Z9WGyuqyOhOMaV5?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:F81xHtTKqOFHqZ9oVtQSc36S6-M="
        },
        "rankings": 10,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 182525221444122,
          "name": "\\u676d\\u5dde\\u5927\\u6cfd",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FtSKrR35TqQ95vexA-LSnO1kA8Si?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:mlEFm7KG1tbAbnsj0FQQHx_mklM="
        },
        "rankings": 11,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 818882241118112,
          "name": "\\u70ed\\u5fc3\\u5e02\\u6c11\\u8001\\u9ec4",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FhHuH_ddUBmrfml3YLVwjMu-N0LS?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:wK7nbx1h_KvRfRSBnvE5Fa3dCMg="
        },
        "rankings": 12,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 214512458248251,
          "name": "\\u4e58\\u5cf0",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FlXQH1uoESNkLxaLiuHiDKXpbZjS?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:rdYG1rjHfT8P8Q_eVFRC8vr06o0="
        },
        "rankings": 13,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 812251148481252,
          "name": "\\u5357\\u4e66",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fp6Ca85CvcxtVheIJ1IFi6lx3Wsm?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:7x7_90ELJ6RLdzWvjzlTPeK4IIQ="
        },
        "rankings": 14,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 844188558554552,
          "name": "\\u78a7\\u7b71\\u542b\\u85b0",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fo_2KeXu7K-AfMvnAvZHbJ_VzSxN?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:9XTYT_dzMKbBDEEw1HWLFZ7nxeY="
        },
        "rankings": 15,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 418584842585588,
          "name": "\\u00a0 \\u00a0 \\u00a0\\u00a0 \\u00a0 \\u00a0",
          "alias": "John",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FpV8oAH3X2sSkc_2Es8G9l-dwVzi?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:_B44kpCD9inbiuULqogMsCS3nXU="
        },
        "rankings": 16,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 185415411548512,
          "name": "\\u84c9\\u84c9",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FhAzMlByhdWMhgtHNPr_q7Zfo2Vi?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:pRuQdVgc0GpWStIQdlZKkypz9ac="
        },
        "rankings": 17,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 548245848128184,
          "name": "\\u91d1\\u6b63\\u594e",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FmUMVn0tcJn9ZZ5JXfH_jBkoNpV7?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:VWczkrCBzOz8y-wJZ24DTcuIA24="
        },
        "rankings": 18,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 544812225421154,
          "name": "\\u9633\\u514999",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FqmaxOocDZcPMSXSVWjUO1W_-Akv?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:0T1hvi6td-aoYsKMNsIJmojLocQ="
        },
        "rankings": 19,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 458145252528,
          "name": "Liang",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FpV-9SGrMlyvg_2p5nTfmUg1gc4U?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:ROckToDElpGhW97qG_aNVPzIl7E="
        },
        "rankings": 20,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 111885485585552,
          "name": "LI\\ud83d\\udd25",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FneF17dA_E8r-CWp30aBW1vKIQuf?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:_78XrZKUmtZ1XaxrFsk08zpXFiQ="
        },
        "rankings": 21,
        "checkined_days": 8
      }
    ],
    "user_specific": {
      "user": {
        "user_id": 184444848828412,
        "name": "\\u6613\\u5b89",
        "alias": "",
        "avatar_url": "https:\\/\\/images.zsxq.com\\/FriZRDmr30xyldqJusczqW_LdCt_?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Mnx031tLjP0aPwopcfDGIMwg_20="
      },
      "rankings": 0,
      "checkined_days": 0
    }
  }
}
```