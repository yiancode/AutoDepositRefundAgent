## 累计排行接口，获取到用户的user_id

request：

https://api.zsxq.com/v2/groups/15555411412112/checkins/4252248858/ranking_list?type=accumulated&index=0

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761583853" -H "accept: */*" -H "authorization: EC395C81-4889-41EB-9A3A-83C9B4A6EC4A_C7FC4C169922C77C" -H "x-signature: 85bdc3c6fcf89046bf9de5bcb96a3953e3bcac24" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: 2c3be6fb-07bd-47d4-b14d-0b633c7bcc77" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/checkins/4252248858/ranking_list?type=accumulated&index=0"


response:

```
{
  "succeeded": true,
  "resp_data": {
    "ranking_list": [
      {
        "user": {
          "user_id": 412451285841818,
          "name": "\\u51cc\\u98ce",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fmd-EoL627Q0CZJmal2XUZXNnqru?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:skui57iHHwVvRgjg25BWD8M3-kg="
        },
        "rankings": 1,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 15411425221212,
          "name": "\\u523a\\u5ba2",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FpiwxF7N2kwM9KMTuDCDBOeblvas?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:n81qOWEG-5Zz9Y76WxG_mOMUFBM="
        },
        "rankings": 2,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 51142148545524,
          "name": "\\u6c34\\u6728\\u6797\\u68ee",
          "alias": "\\u6c34\\u6728\\u6797\\u68ee",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FnciLUK2m7Y0c1S6oea7j4JN-WEJ?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:cLB7js0E1ocpcXEcNy_WLrk7gzU="
        },
        "rankings": 3,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 422184882581848,
          "name": "\\u964c\\u767d",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FlgO_29YqEPisDNKOzvPUkQ6BAaM?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:hvTJvWJXyS9GBThXDVowNyYSYCg="
        },
        "rankings": 4,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 181285218154122,
          "name": "\\u60a0\\u60a0",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fj8-xWVm7sWbjhCzO0Tp9JO4IzOW?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:wECS4SSWVIfzIukH9hwOociBvcQ="
        },
        "rankings": 5,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 844151111541252,
          "name": "\\u73b2\\u4e00",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FibxYqUGI0P9YqLajwtGexmELwo6?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:zsOEsHsRfmqmQ19H76STQX4wW5Y="
        },
        "rankings": 6,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 212544188448281,
          "name": "\\u5927\\u5730",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FukP0hBPkZtgVMWzGu91cMMqhNtK?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:0fG143ZloILXHTMIgDRjGpyDa-I="
        },
        "rankings": 7,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 51445285455824,
          "name": "Zhongwei",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FsWvvLVZeJzRLE_EyRnGkeZOTh8R?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:V0hs9uRbp9mhIR4bVpTYZ7IXAB0="
        },
        "rankings": 8,
        "checkined_days": 9
      },
      {
        "user": {
          "user_id": 585152812228254,
          "name": "G",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FhC1oNRym12tcqiVpdgRI_LXavLb?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:waf-d5NKkgzac6O1g5Yjysfw-eI="
        },
        "rankings": 9,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 418528525445558,
          "name": "Albert",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FtYZ9VHsw54gdsVuY-DcF-ubhPv-?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:XMHi6-ZjxIMX5D8UO2ZzDj6FWRc="
        },
        "rankings": 10,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 51184582245114,
          "name": "\\u4e03\\u54e5",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FkSomyyH6QyyUF7gcswx3qinKyEq?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:8A5R0quD4RL8w2LjH9h-77E5_oY="
        },
        "rankings": 11,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 184521818421152,
          "name": "\\u5e73\\u5730\\u9752\\u4e91",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FjE2sybo15Mx2aDSC4-1T1Jb41Kb?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:aWUo5RZOEx086U7mJhhnNBqXFko="
        },
        "rankings": 12,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 15541511142542,
          "name": "\\u98de\\u9e3d",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fu1-irDWAik1lX4vGyY0n8t2if_k?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:TqRSpROxjG6qoAb9rgfBCUoAB2U="
        },
        "rankings": 13,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 585224858245114,
          "name": "\\u5927\\u8463",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fvf5hr_K5tLJ9mr6o_hZRWAxufPg?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:LYvF8cz_YGzh8hbmvHX0nEirQ1o="
        },
        "rankings": 14,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 118514215551542,
          "name": "\\u97e9\\u97e9",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FpsO9pY0_ETM2QoFHNdpTff33PMP?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:XR7MfH4GOw4eekXxStQJzULKt4U="
        },
        "rankings": 15,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 412411542484258,
          "name": "\\u7d2b\\u82cf\\u96ea\\u51ac",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fl0zZ0JsD9au0-wb2lDdGoTX4xAg?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:62WeZyBW3CMaftfXKlp_qWRWolE="
        },
        "rankings": 16,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 815541428551112,
          "name": "\\u6f47\\u6e58\\u96e8\\u591c007",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FoF5yLFl-SjhzdmpnNFUdaGr94MM?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:nIPRJ36bAfM85vGO6jiI9aBNv1w="
        },
        "rankings": 17,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 184514422514852,
          "name": "\\u6ca1\\u529b\\u6c14\\u6ca1\\u80c3\\u53e3",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FrIsZf3yZcWZkCBWOMIqNjUkhfha?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:uw7g9o5pLb4r4UiVh_LPK3TUhD8="
        },
        "rankings": 18,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 815822242258482,
          "name": "\\u5c1a\\u683c\\u5218\\u73cd",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FqLmK1LtKZfVvX7WWukpM-EYz4vA?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:EylagzChVKz-SP_pk0KvSiv0Wqw="
        },
        "rankings": 19,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 181528255251412,
          "name": "\\u51b2\\u5341\\u4e8c",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/Fv5L9xSdh7ykeUG5Bfl6mOp2VxsW?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:hmKBCWJRexS7ZG-mQymQrjv9fNc="
        },
        "rankings": 20,
        "checkined_days": 8
      },
      {
        "user": {
          "user_id": 412452441421528,
          "name": "\\u6930\\u5575\\u5976\\u7cd6\\u5473",
          "alias": "",
          "avatar_url": "https:\\/\\/images.zsxq.com\\/FuI80xpHTMlZJWqpXHebYQlSu_ER?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:4piUqhN6QD_4NvrJl8mTxNOAZzI="
        },
        "rankings": 21,
        "checkined_days": 7
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
## 查询用户详情，以及用户编号 number

其中15555411412112是星球的group_id从配置.env中获取，454881884228是当前这个用户的user_id



request：

https://api.zsxq.com/v2/groups/15555411412112/members/454881884228/summary

curl -H "Host: api.zsxq.com" -H "content-type: application/json; charset=utf-8" -H "x-timestamp: 1761584941" -H "accept: */*" -H "authorization: EC395C81-4889-41EB-9A3A-83C9B4A6EC4A_C7FC4C169922C77C" -H "x-signature: 51c147579780c0f93021deeeedbfafe0e8ece6a1" -H "x-aduid: d75d966c-ed30-4fe8-b0f9-f030eb39d9be" -H "priority: u=3, i" -H "x-version: 2.82.0" -H "accept-language: zh-Hans-US;q=1" -H "x-request-id: f0501037-5ae1-466e-bbfb-9105053e54fc" -H "user-agent: xiaomiquan/5.28.1 iOS/phone/26.0.1 iPhone Mobile" --compressed "https://api.zsxq.com/v2/groups/15555411412112/members/454881884228/summary"


response：

```

{
  "succeeded": true,
  "resp_data": {
    "joined_days": 419,
    "topics_count": 40,
    "liked_count": 27,
    "renewal_count": 1,
    "invitees_count": 0,
    "paid": true,
    "member": {
      "user_id": 454881884228,
      "name": "\\u9752\\u5f26",
      "avatar_url": "https:\\/\\/images.zsxq.com\\/FruIXoMh1XumO2zqhYagjY85B1Gk?imageMogr2\\/auto-orient\\/thumbnail\\/150x\\/format\\/jpg\\/blur\\/1x0\\/quality\\/75\\/ignore-error\\/1&e=1764518399&token=kIxbL07-8jAj8w1n4s9zv64FuZZNEATmlU_Vm6zD:pCZj-HeXDkihiAFzJEFznqLNGAg=",
      "number": 177,
      "unique_id": "huangfenng",
      "join_time": "2024-09-04T22:39:05.287+0800",
      "status": "joined",
      "expired_time": "2026-09-04T22:39:05.287+0800",
      "introduction": "\\u9ad8\\u7ea7\\u524d\\u7aef\\u5f00\\u53d1\\u5de5\\u7a0b\\u5e08"
    }
  }
}

```