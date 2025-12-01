下面这几个接口,是我通过抓包工具charles分析出来的手机端获取项目打卡信息,打卡排行榜的接口,请求包含url和curl两个链接,JSON返回结果已解码为正常中文显示。
-- 我需要你根据以下请求和响应的数据结构设计v0版本的数据模型和API。

## 全部打卡挑战,点击"打卡挑战"

### 进行中的打卡

1)请求

https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=ongoing&count=100

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761507257" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: 6178b8c8ee26c9b81fc1ecdec0db2216b0d3be81" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 62ef6c57-a8cd-47ee-ac57-fc61e2a2c1ae" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=ongoing&count=100"

2)响应

```json
{
  "succeeded": true,
  "resp_data": {
    "checkins": [
      {
        "checkin_id": 2424424541,
        "group": {
          "group_id": 15555411412112,
          "name": "AI私域赚钱",
          "background_url": "https://images.zsxq.com/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 582884445452854,
          "name": "深圳大冲",
          "avatar_url": "https://images.zsxq.com/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
          "description": "AI私域赚钱星球主理人,项目型 IP 孵化教练,主业架构师、副业销冠操盘手、副业首年收入超百万,一人企业私域社群商业化探索者、大冲十年退休计划发起人。"
        },
        "title": "2510 AI小绿书爆文",
        "text": "1、#AI私域赚钱星球打卡后,以星球打卡次数为准,不允许水卡和摸鱼,认真打卡,对得起自己。\n\n打卡你学习的内容,成果,避坑,想分享给别人的知识经验技巧,与本项目有关的内容等。\n\n2、退押金规则:\n完成7天打卡,押金39全退,未完成7天打卡或者水卡的押金不退,数据以星球的累计打卡排行榜为准,截止日期以群公告的说明为准。\n\n3、加大冲微信:95017333交押金39元进群。",
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
            "avatar_url": "https://images.zsxq.com/Fr1Wa5ogbq615ukeK9N1YrzzNc8h?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:FcQXqRyPIW1TkK7_dApJ8t1_8pA="
          },
          {
            "avatar_url": "https://images.zsxq.com/Fvqt2jdHEgXsk3Wh5qiCyXNPDqUF?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:3r4LrP1iKZZ1wu3-YNjr8RhNJLA="
          },
          {
            "avatar_url": "https://images.zsxq.com/FnnSQLk96IdI-TSM3G5hdKiVEi89?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:gQEaSn4D0hlJmablUU61BoarIw0="
          },
          {
            "avatar_url": "https://images.zsxq.com/FjuwRreje2tX4Di-4NiWBRu3xFNq?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:6AXvaL7mlIeY1s9Ql3jw2dy5CU4="
          },
          {
            "avatar_url": "https://images.zsxq.com/Fntvm9u1d00VlC_ahAYfV6hDD7jN?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:wtG1Nzdsu7-rTqeaN_zOeGaj_Oc="
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

```json
{
  "succeeded": true,
  "resp_data": {
    "checkins": [
      {
        "checkin_id": 8424481182,
        "group": {
          "group_id": 15555411412112,
          "name": "AI私域赚钱",
          "background_url": "https://images.zsxq.com/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 582884445452854,
          "name": "深圳大冲",
          "avatar_url": "https://images.zsxq.com/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
          "description": "AI私域赚钱星球主理人,项目型 IP 孵化教练,主业架构师、副业销冠操盘手、副业首年收入超百万,一人企业私域社群商业化探索者、大冲十年退休计划发起人。"
        },
        "title": "2510 AI写作(软件文档)",
        "text": "1、#AI私域赚钱星球打卡后,以星球打卡次数为准,不允许水卡和摸鱼,认真打卡,对得起自己。\n\n打卡你学习的内容,成果,避坑,想分享给别人的知识经验技巧,与本项目有关的内容等。\n\n2、退押金规则:\n完成7天打卡,押金39全退,未完成7天打卡或者水卡的押金不退,数据以星球的累计打卡排行榜为准,截止日期以「项目群公告」的说明为准。\n\n3、加大冲微信:95017333交押金39元进群。",
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
            "avatar_url": "https://images.zsxq.com/FgA5EhIzQLYYi3vk2p2D5SrEQWNL?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:IUWHmLuem3VfNYX4HYnhnOhZy_8="
          },
          {
            "avatar_url": "https://images.zsxq.com/FvJvtOpK2PChh6GajurqeCQFayUQ?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Hi-1Zk-5uwkJgmIRe4n3xRdUt5g="
          },
          {
            "avatar_url": "https://images.zsxq.com/Fi6JXuCV5KvxRL7OgI_ffy0O3MC-?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:j4TrfERawAPZSvU0VzjHbEwKAJM="
          },
          {
            "avatar_url": "https://images.zsxq.com/FkrDTgqrAuoDvbP9fyS9WK2CqZqL?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:bIbQ2RWJmKLLP09TJ2LZJQxS7_g="
          },
          {
            "avatar_url": "https://images.zsxq.com/FjwIzEH38ooTy1acVHpPPhMwDDVG?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:6ymAIYoCQsIW1XwgnX7jhOnJEDI="
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
          "name": "AI私域赚钱",
          "background_url": "https://images.zsxq.com/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 582884445452854,
          "name": "深圳大冲",
          "avatar_url": "https://images.zsxq.com/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
          "description": "AI私域赚钱星球主理人,项目型 IP 孵化教练,主业架构师、副业销冠操盘手、副业首年收入超百万,一人企业私域社群商业化探索者、大冲十年退休计划发起人。"
        },
        "title": "2510 AI编程",
        "text": "1、#AI私域赚钱星球打卡后,以星球打卡次数为准,不允许水卡和摸鱼,认真打卡,对得起自己。\n\n打卡你学习的内容,成果,避坑,想分享给别人的知识经验技巧,与本项目有关的内容等。\n\n2、退押金规则:\n完成7天打卡,押金39全退,未完成7天打卡或者水卡的押金不退,数据以星球的累计打卡排行榜为准,截止日期以「项目群公告」的说明为准。\n\n3、加大冲微信:95017333交押金39元进群。",
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
            "avatar_url": "https://images.zsxq.com/FmnMGb74_Wm4dVXmUWcFVuBdU2X9?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:DrZJsSPti0Q1AMc5GChvbqrkeSQ="
          },
          {
            "avatar_url": "https://images.zsxq.com/FuH4HMvS4qbwLb_iAbXtm6akWXQJ?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:ZF3iyEt-j_qGelUJB8y_wehOLlU="
          },
          {
            "avatar_url": "https://images.zsxq.com/Fr_Ahlrqj7uEctsFq3VL-qEGCSzz?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Hc6YkBCcHf3yFucY7mNGb3JopXk="
          },
          {
            "avatar_url": "https://images.zsxq.com/FmCz5cqVofjYg1HsmqkJy1Idi46Q?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:9jukcLrLTBGdUFmtxZsnjROowfk="
          },
          {
            "avatar_url": "https://images.zsxq.com/FsqGg8toxMwT8ziPUJQE8sEzK8kY?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:0ecwM6HObMvz0UD2QWIlWZ6CSdE="
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

1)请求
https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=closed&count=30

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761507257" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: 43d5ffaba774a51f40a23434f16edd527bd80d9d" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 12e5b7b0-1c1a-46ca-bc86-e0ceb534606e" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins?scope=closed&count=30"

2)响应
```json
{
  "succeeded": true,
  "resp_data": {
    "checkins": [
      {
        "checkin_id": 1141425812,
        "group": {
          "group_id": 15555411412112,
          "name": "AI私域赚钱",
          "background_url": "https://images.zsxq.com/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
        },
        "owner": {
          "user_id": 28248815485121,
          "name": "深圳老易",
          "alias": "深圳老易",
          "avatar_url": "https://images.zsxq.com/FmxHUIwoaOBEYL-RPqv36m4rpi0u?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:ud-NemaLyz2f-K0jC6KfDCg2TTU="
        },
        "title": "2509 小红书虚拟电商与资料引流",
        "text": "1、#AI私域赚钱星球打卡后,以星球次数打卡为准,不允许水卡和摸鱼,认真打卡,对得起自己。\n\n打卡你学习的内容,成果,避坑,想分享给别人的知识经验技巧,与本项目有关的内容等。\n\n2、退押金规则:\n完成10天打卡,押金39全退,未完成10天打卡或者水卡的押金不退,数据以星球的累计打卡排行榜为准,截止日期以群公告的说明为准。\n\n3、加大冲微信:330517251交押金39元进群。",
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
            "avatar_url": "https://images.zsxq.com/FkojEV_eWaWJe45riK4zjVlXVsOC?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:etiji5taS-AQq91_7fXUc7sdGsY="
          },
          {
            "avatar_url": "https://images.zsxq.com/FnAiHiCIkPZuG2jvvfXXqdcZEN3x?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:eM1bOR_VeTThTRi0JAelqS7KXHk="
          },
          {
            "avatar_url": "https://images.zsxq.com/Fv5L9xSdh7ykeUG5Bfl6mOp2VxsW?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:hmKBCWJRexS7ZG-mQymQrjv9fNc="
          },
          {
            "avatar_url": "https://images.zsxq.com/FoA1-uBnpTIHNr19e_l3XCbixb0Q?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:eXAVpcij6fNA7A02oLl6hLd6XRE="
          },
          {
            "avatar_url": "https://images.zsxq.com/Fjnrf6uAWCbahHE7jc_t3JgXLTo9?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:WLhPzPfYNyDUf_0bGJ9TZwKo11s="
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

## 查看打卡,点击"去查看"

### 查看打卡规则

1)请求

https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761508315" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: 2a7aab94de20aa32d66402a5b82bfc4cb771deaf" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 8e32d2b0-f2c2-413e-ac6f-eb2c74c529a9" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182"

2)响应

```json
{
  "succeeded": true,
  "resp_data": {
    "is_valid_member": true,
    "checkin": {
      "checkin_id": 8424481182,
      "group": {
        "group_id": 15555411412112,
        "name": "AI私域赚钱",
        "background_url": "https://images.zsxq.com/Flolz-nIvObiaYHk2yOnZKehJzvb?e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:l4ruyVzIxEeJKbfPlUAbbiS0-RE="
      },
      "owner": {
        "user_id": 582884445452854,
        "name": "深圳大冲",
        "avatar_url": "https://images.zsxq.com/FvMsMu9H2_vt7RZ3ZmeiSRAE-5Zk?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4l1XJhsu1UwUXAXSlLUjnMndn7k=",
        "description": "AI私域赚钱星球主理人,项目型 IP 孵化教练,主业架构师、副业销冠操盘手、副业首年收入超百万,一人企业私域社群商业化探索者、大冲十年退休计划发起人。"
      },
      "title": "2510 AI写作(软件文档)",
      "text": "1、#AI私域赚钱星球打卡后,以星球打卡次数为准,不允许水卡和摸鱼,认真打卡,对得起自己。\n\n打卡你学习的内容,成果,避坑,想分享给别人的知识经验技巧,与本项目有关的内容等。\n\n2、退押金规则:\n完成7天打卡,押金39全退,未完成7天打卡或者水卡的押金不退,数据以星球的累计打卡排行榜为准,截止日期以「项目群公告」的说明为准。\n\n3、加大冲微信:95017333交押金39元进群。",
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
          "avatar_url": "https://images.zsxq.com/FgA5EhIzQLYYi3vk2p2D5SrEQWNL?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:IUWHmLuem3VfNYX4HYnhnOhZy_8="
        },
        {
          "avatar_url": "https://images.zsxq.com/FvJvtOpK2PChh6GajurqeCQFayUQ?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Hi-1Zk-5uwkJgmIRe4n3xRdUt5g="
        },
        {
          "avatar_url": "https://images.zsxq.com/Fi6JXuCV5KvxRL7OgI_ffy0O3MC-?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:j4TrfERawAPZSvU0VzjHbEwKAJM="
        },
        {
          "avatar_url": "https://images.zsxq.com/FkrDTgqrAuoDvbP9fyS9WK2CqZqL?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:bIbQ2RWJmKLLP09TJ2LZJQxS7_g="
        },
        {
          "avatar_url": "https://images.zsxq.com/FjwIzEH38ooTy1acVHpPPhMwDDVG?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:6ymAIYoCQsIW1XwgnX7jhOnJEDI="
        }
      ],
      "user_specific": {
        "joined": false
      },
      "min_words_count": 30
    },
    "group": {
      "name": "AI私域赚钱"
    }
  }
}

```

### 打卡排行榜:累计打卡榜

1)请求

https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182/ranking_list?type=accumulated&index=0

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761508323" -H "accept: */*" -H "authorization: 7C90146F-77CC-49F1-89CE-2F213C4E467E_C7FC4C169922C77C" -H "x-signature: fa46b7d9b5e7b478d0fcecabc86e3705494ae9cf" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 4d1b60bc-4fad-4180-a5c5-d3850882544c" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins/8424481182/ranking_list?type=accumulated&index=0"

2)响应

```json
{
  "succeeded": true,
  "resp_data": {
    "ranking_list": [
      {
        "user": {
          "user_id": 88455815452182,
          "name": "球球的副业探索路",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/Fs-rw8bu107F3erUkXoQVISDtG-L?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Sa9P1KtL4br910MJTUD7G2dVKyo="
        },
        "rankings": 1,
        "checkined_days": 10
      },
      {
        "user": {
          "user_id": 118512224282822,
          "name": "Aaron",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/Fua_gW_cXWtfvk3L2nNHVvdrI3eV?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:3HNXuo4twCc9UAPuQVioi8Sq4pI="
        },
        "rankings": 2,
        "checkined_days": 10
      },
      {
        "user": {
          "user_id": 215854811822181,
          "name": "向阳",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FrppxYGSg2czsYkHA_8VzOVUdy7T?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:mCa_iqwWX9gmibvy6yrLXi5pbto="
        },
        "rankings": 3,
        "checkined_days": 10
      },
      {
        "user": {
          "user_id": 548841115125224,
          "name": "Catherine",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FvRPfdCd3riB42bO2yYJkJ53FZWD?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:K-BHeN3sKGI1uM_3xh8ZNgHkJos="
        },
        "rankings": 4,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 818512125281152,
          "name": "两个俩",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FjYEuVulrMoWWuFCXqY7uZPKeG9p?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:A0JJPGdVqX5qUOC3YNSl1jkB46U="
        },
        "rankings": 5,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 15548451211212,
          "name": "木鱼非零",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FhBicEcyzkJ478KBRV47d3Uk2x9h?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:fujJhkk_u7B4NxG_KC2ljxyCI5g="
        },
        "rankings": 6,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 412452582824828,
          "name": "殷紫东",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FmCz5cqVofjYg1HsmqkJy1Idi46Q?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:9jukcLrLTBGdUFmtxZsnjROowfk="
        },
        "rankings": 7,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 88512124218122,
          "name": "壮壮0928",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FnBTybznTT1YluVs2Zwy7XTQH5dN?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:jwEQUxZ5fhHOpFuB-vxwfgO4S1o="
        },
        "rankings": 8,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 15411425221212,
          "name": "刺客",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FpiwxF7N2kwM9KMTuDCDBOeblvas?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:n81qOWEG-5Zz9Y76WxG_mOMUFBM="
        },
        "rankings": 9,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 4252115258,
          "name": "万物苏",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/Fs0NRQi99F_k7Z9WGyuqyOhOMaV5?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:F81xHtTKqOFHqZ9oVtQSc36S6-M="
        },
        "rankings": 10,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 182525221444122,
          "name": "杭州大泽",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FtSKrR35TqQ95vexA-LSnO1kA8Si?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:mlEFm7KG1tbAbnsj0FQQHx_mklM="
        },
        "rankings": 11,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 818882241118112,
          "name": "热心市民老黄",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FhHuH_ddUBmrfml3YLVwjMu-N0LS?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:wK7nbx1h_KvRfRSBnvE5Fa3dCMg="
        },
        "rankings": 12,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 214512458248251,
          "name": "乘峰",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FlXQH1uoESNkLxaLiuHiDKXpbZjS?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:rdYG1rjHfT8P8Q_eVFRC8vr06o0="
        },
        "rankings": 13,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 812251148481252,
          "name": "南书",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/Fp6Ca85CvcxtVheIJ1IFi6lx3Wsm?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:7x7_90ELJ6RLdzWvjzlTPeK4IIQ="
        },
        "rankings": 14,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 844188558554552,
          "name": "碧笋含萰",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/Fo_2KeXu7K-AfMvnAvZHbJ_VzSxN?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:9XTYT_dzMKbBDEEw1HWLFZ7nxeY="
        },
        "rankings": 15,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 418584842585588,
          "name": "      ",
          "alias": "John",
          "avatar_url": "https://images.zsxq.com/FpV8oAH3X2sSkc_2Es8G9l-dwVzi?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:_B44kpCD9inbiuULqogMsCS3nXU="
        },
        "rankings": 16,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 185415411548512,
          "name": "蓉蓉",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FhAzMlByhdWMhgtHNPr_q7Zfo2Vi?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:pRuQdVgc0GpWStIQdlZKkypz9ac="
        },
        "rankings": 17,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 548245848128184,
          "name": "金正奎",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FmUMVn0tcJn9ZZ5JXfH_jBkoNpV7?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:VWczkrCBzOz8y-wJZ24DTcuIA24="
        },
        "rankings": 18,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 544812225421154,
          "name": "阳光99",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FqmaxOocDZcPMSXSVWjUO1W_-Akv?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:0T1hvi6td-aoYsKMNsIJmojLocQ="
        },
        "rankings": 19,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 458145252528,
          "name": "Liang",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FpV-9SGrMlyvg_2p5nTfmUg1gc4U?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:ROckToDElpGhW97qG_aNVPzIl7E="
        },
        "rankings": 20,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 111885485585552,
          "name": "LI🔥",
          "alias": "",
          "avatar_url": "https://images.zsxq.com/FneF17dA_E8r-CWp30aBW1vKIQuf?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:_78XrZKUmtZ1XaxrFsk08zpXFiQ="
        },
        "rankings": 21,
        "checkined_days": 8
      }
    ],
    "user_specific": {
      "user": {
        "user_id": 184444848828412,
        "name": "易安",
        "alias": "",
        "avatar_url": "https://images.zsxq.com/FriZRDmr30xyldqJusczqW_LdCt_?imageMogr2/auto-orient/thumbnail/150x/format/jpg/blur/1x0/quality/75/ignore-error/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:Mnx031tLjP0aPwopcfDGIMwg_20="
      },
      "rankings": 0,
      "checkined_days": 0
    }
  }
}
```