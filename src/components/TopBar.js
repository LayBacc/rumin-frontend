import React, { useState, useContext, useRef, forwardRef, useImperativeHandle } from "react"
import DatePicker from "react-datepicker"
import { HamMenuDropdown } from './HeaderSection'
import queryString from 'query-string'
import moment from 'moment'
import { ClickHandler } from './ClickHandler'
import * as uuid from 'uuid'

import AppContext from './AppContext'

export const TopBar = forwardRef((props, ref) => {
  const appContext = useContext(AppContext)
  const inputRef = useRef()

  const [query, setQuery] = useState(props.initialQuery || '')
  const [typingTimer, setTypingTimer] = useState(null)
  const [isFetchingAS, setIsFetchingAS] = useState(false)

  const [showASResults, setShowASResults] = useState(false)

  const [searchResults, setSearchResults] = useState([])  // results fetched from search API
  const [existingResults, setExistingResults] = useState([])

  const [showMenu, setShowMenu] = useState(false)

  useImperativeHandle(ref, () => ({
    focusOnInput() {
      inputRef.current.focus()
    }
  }))

  const fetchAutosuggest = () => {
    if (query.length < 2) return

    setIsFetchingAS(true)

    fetch(`/api/v1/search/?q=${query}&explorer=true`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          this.setState({ accessDenied: true })
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(data => {
      if (data.results.length === 0) {
        // setNoResults(true)
        setIsFetchingAS(false)
        return
      }

      setSearchResults(data.results)
      setIsFetchingAS(false)
      setShowASResults(true)
    })
    .catch(error => {
      console.log('error: ' + error)
    }) 
  }

  const updateDemoResults = () => {
    const demoSearchData = [
      {
        "id": "0e7cbc75-31f9-4d32-aaa3-e6137c6552c2",
        "title": "",
        "content_type": "Space",
        "x": 516,
        "y": 28.145828247070312
      },
      {
        "id": "3d902cdc-82e5-4063-8b60-31c945de5528",
        "title": "r/NoCode",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://www.reddit.com/r/nocode/#SHORTCUT_FOCUSABLE_DIV",
          "page_title": "No Code",
          "favicon_url": "https://www.redditstatic.com/desktop2x/img/favicon/badged-favicon-32x32.png"
        },
        "json_body": [
          {
            "id": "f3458a5b-b0cf-4943-9dc7-d146f89ba1ab",
            "type": "paragraph",
            "children": [
              {
                "text": ""
              }
            ]
          }
        ],
        "collection": [
          {
            "id": "eae425f8-66d6-452d-af10-47afef1ca31b",
            "type": "Space"
          },
          {
            "id": "ab20af06-ad6c-4931-93dd-73fccb5f6a99",
            "type": "Space"
          }
        ],
        "ancestry": [],
        "x": 1002.8535376745275,
        "y": 171.69823915654064,
        "centerX": 1127.8535376745276,
        "centerY": 204.19823915654064
      },
      {
        "id": "c6e97909-c7fb-4b79-bfa9-be02351188d8",
        "title": "Makerpad",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://www.makerpad.co/",
          "page_title": "Please read our COVID response",
          "favicon_url": "https://assets-global.website-files.com/5c1a1fb9f264d636fe4b69fa/5d4d52098620aee2d23aa01b_M%20Logo%20Official%20Transparent%20Favicon%2032.png"
        },
        "json_body": [
          {
            "id": "8a34a9bc-4e5a-4ce9-bf67-56b6e4eaaa51",
            "type": "paragraph",
            "children": [
              {
                "text": "Build & operate businesses without code | "
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": 778.6420545980452,
        "y": 192.73678141526563,
        "centerX": 903.6420545980452,
        "centerY": 225.23678141526563
      },
      {
        "id": "8a88feff-e877-4213-bbec-c7f40d788f09",
        "title": "Nucode",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://www.nucode.co/",
          "favicon_url": "https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fs3.amazonaws.com%2Fappforest_uf%2Ff1578076349500x588317571298718100%2FProfile%2520Picture-1.png?w=128&h=&auto=compress&dpr=1&fit=max"
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": ""
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": 1040.1839371745345,
        "y": 341.59230244827677,
        "centerX": 1165.1839371745345,
        "centerY": 374.09230244827677
      },
      {
        "id": "1539b61f-6f6e-49bd-8617-2537631ccd9a",
        "title": "Nocode HQ",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://community.nocodehq.com/",
          "page_title": "Welcome to the Nocode Community by Nocode HQ!",
          "favicon_url": "https://static.t-cdn.net/5e1c8cc94ababc41c984928b/portals/favicon_41821.png"
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": "\n"
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": 505.0949723062191,
        "y": 194.8408538039013,
        "centerX": 630.0949723062191,
        "centerY": 227.3408538039013
      },
      {
        "id": "20b4b0ce-ef5b-41fe-aa03-27d67f27735b",
        "title": "Parabola.io",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://parabola.io/",
          "page_title": "Your computer should work for you.",
          "favicon_url": "https://assets.website-files.com/5d9bd68c0f53874617f2081b/5de55550d5773c2841c00c1a_parabola_circle_32.png"
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": "\"Make your computer work for you.\"\n"
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": 1180.7169607058393,
        "y": 452.4188246961957,
        "centerX": 1305.7169607058393,
        "centerY": 484.9188246961957
      },
      {
        "id": "6c6d981d-e21e-4484-ae5c-d33238e7c6d5",
        "title": "Pipefy",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://www.pipefy.com/",
          "page_title": "Pipefy Product Tour",
          "favicon_url": null
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": ""
              },
              {
                "url": "/spaces/17737d4e-a706-43b9-94a9-4b77425ea047",
                "type": "link",
                "children": [
                  {
                    "text": "No code"
                  }
                ]
              },
              {
                "text": " "
              },
              {
                "url": "/spaces/992c90e0-706f-414c-81cb-c65f762edc2d",
                "type": "link",
                "children": [
                  {
                    "text": "process management"
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          },
          {
            "id": "a60e15ed-f8f1-4323-abd0-944194a71ab3",
            "type": "paragraph",
            "children": [
              {
                "text": "Workflow Management | Process Management and Automation | Request Management"
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": 371.7639525124281,
        "y": 770.4014673744896
      },
      {
        "id": "1a89b859-8df0-4db9-987e-31db53a1c030",
        "title": "Box.com Relay",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://www.box.com/collaboration/relay-workflow",
          "favicon_url": "https://www.box.com/themes/custom/box/favicons/favicon.ico?q97pzm"
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": ""
              },
              {
                "url": "/spaces/71b1bb76-7862-4675-b8fa-3d0050ad6687",
                "type": "link",
                "children": [
                  {
                    "text": "Box.com"
                  }
                ]
              },
              {
                "text": " in "
              },
              {
                "url": "/spaces/17737d4e-a706-43b9-94a9-4b77425ea047",
                "type": "link",
                "children": [
                  {
                    "text": "no code"
                  }
                ]
              },
              {
                "text": " and "
              },
              {
                "url": "/spaces/358e72e8-63ef-46ba-a9c5-e4dc66cd45b6",
                "type": "link",
                "children": [
                  {
                    "text": "automation"
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          },
          {
            "id": "8d57ce3d-d7be-4571-8e31-91bd5320af90",
            "type": "paragraph",
            "children": [
              {
                "text": "Workflow Automation and Business Process Management | Box Relay"
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": 770.4111399011242,
        "y": 780.4074136198541,
        "centerX": 895.4111399011242,
        "centerY": 812.9074136198541
      },
      {
        "id": "f14796ff-be7a-4144-a865-8a7990e4aa6b",
        "title": "Zapier",
        "icon": "https://storage.googleapis.com/rumin-gcs-bucket/icons/d55d7712-be6e-47c7-a93b-562c677b7ef3.png",
        "content_type": "Space",
        "custom_fields": {
          "year_founded": "2011",
          "initial_release": "August 1, 2012",
          "headquarters_location": "San Francisco, California, United States"
        },
        "json_body": [
          {
            "id": "26fe71b7-8fb1-4c4c-88c3-7d0332e819e0",
            "type": "paragraph",
            "children": [
              {
                "text": "Zapier is a global remote company that allows end users to integrate the web applications they use. Although Zapier is based in Sunnyvale, California, it employs a workforce of 250 employees located around the United States and in 23 other countries."
              }
            ]
          }
        ],
        "collection": [
          {
            "id": "2e8f3de2-3dde-4750-94df-5e802fae6d56",
            "type": "Space"
          }
        ],
        "ancestry": [
          "dd5900bd-3ba8-4ec1-9f98-5987eb24a600"
        ],
        "x": 561.7457404570881,
        "y": 767.0726896790677
      },
      {
        "id": "e7e0b5f2-1c4f-4e61-9ad8-500fa65d216c",
        "title": "UIPath",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [],
        "collection": [],
        "ancestry": [],
        "x": 143.72140467534865,
        "y": 757.8962648084375
      },
      {
        "id": "8510eb9e-9c12-4722-a14e-994f6d95d82b",
        "title": "Coda.io",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [
          {
            "id": "1591092c-b8fa-4f46-aa5d-defab3a7dadc",
            "type": "paragraph",
            "children": [
              {
                "text": "We may have quite a bit of overlap"
              }
            ]
          },
          {
            "id": "dfbbbbaa-a3b9-4eb7-8ab8-1140a73ed61e",
            "type": "heading-three",
            "children": [
              {
                "text": "Interesting features"
              }
            ]
          },
          {
            "id": "7ba42466-8150-4cf8-9f38-3f171c9c78c9",
            "type": "bulleted-li",
            "children": [
              {
                "text": ""
              },
              {
                "url": "/activities/4545a21d-fdba-42a8-8a4d-becb05086a76",
                "type": "link",
                "children": [
                  {
                    "text": "  Packs "
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          },
          {
            "id": "7ba42466-8150-4cf8-9f38-3f171c9c78c9",
            "type": "bulleted-li",
            "children": [
              {
                "text": ""
              },
              {
                "id": "85683d4d-7528-44a0-864a-612f79445638",
                "url": "/activities/4545a21d-fdba-42a8-8a4d-becb05086a76",
                "type": "link",
                "children": [
                  {
                    "text": " "
                  }
                ]
              },
              {
                "text": ""
              },
              {
                "url": "/spaces/17737d4e-a706-43b9-94a9-4b77425ea047",
                "type": "link",
                "children": [
                  {
                    "text": "  No code  "
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          }
        ],
        "collection": [
          {
            "id": "4545a21d-fdba-42a8-8a4d-becb05086a76",
            "type": "Activity"
          },
          {
            "id": "17737d4e-a706-43b9-94a9-4b77425ea047",
            "type": "Space"
          }
        ],
        "ancestry": [],
        "x": -369.3860699835447,
        "y": 385.9065910988468
      },
      {
        "id": "3975594b-cc7a-453b-a20b-69021a1d3ca1",
        "title": "Retool",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [],
        "collection": [],
        "ancestry": [],
        "x": -113.64273058566289,
        "y": 357.9828107786234
      },
      {
        "id": "b929db2c-11b7-48a6-8dfd-e5f0861d3330",
        "title": "Airtable",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [],
        "collection": [],
        "ancestry": [],
        "x": -417.73393833980697,
        "y": 684.5964755053724
      },
      {
        "id": "ea4db692-f678-46e5-8de7-187c1806366e",
        "title": "Webflow vs Squarespace [May 2020]",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://thedigitalmerchant.com/website/webflow-vs-squarespace/#Main_Differences_between_Webflow_vs_Squarespace",
          "page_title": "Webflow vs Squarespace [May 2020]: Which Site Builder is Best?",
          "favicon_url": "https://thedigitalmerchant.com/wp-content/uploads/2020/01/cropped-The-Digital-Merchant-Icon-32x32.png?x26583"
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": "Main Differences between Webflow vs Squarespace:\nThe main differences between Webflow vs Squarespace are:\n\nWebflow may require a basic understanding and knowledge of coding, whereas Squarespace is a better fit for non-coders and complete newbies\nWebflow allows for more flexibility and customization, whereas Squarespace is more limited to what can be changed \nWebflow has six pricing plans available to choose from and pricing can be higher depending on how many sites created, whereas Squarespace has four plans and a 14-day trial and is often viewed as a good value for the money"
              }
            ]
          },
          {
            "type": "paragraph",
            "children": [
              {
                "text": "Main Differences between Webflow vs Squarespace:\nThe main differences between Webflow vs Squarespace are:\n\nWebflow may require a basic understanding and knowledge of coding, whereas Squarespace is a better fit for non-coders and complete newbies\nWebflow allows for more flexibility and customization, whereas Squarespace is more limited to what can be changed \nWebflow has six pricing plans available to choose from and pricing can be higher depending on how many sites created, whereas Squarespace has four plans and a 14-day trial and is often viewed as a good value for the money"
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": -312.55181343158574,
        "y": 43.302594216111544
      },
      {
        "id": "7276f4aa-c090-4497-9b86-197e378ad7d9",
        "title": "Bubble.io",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": "Bubble introduces a new way to build a web application. It's a no-code point-and-click programming tool. Bubble hosts all applications on its cloud platform."
              }
            ]
          }
        ],
        "collection": [
          {
            "id": "a68a02d0-ce09-4b20-b5ee-ba93c86befdb",
            "type": "Activity"
          }
        ],
        "ancestry": [],
        "x": -442.33549131488513,
        "y": 389.32922733381747
      },
      {
        "id": "c26110ff-86a9-4a8f-b7a3-4ba95adef024",
        "title": "Squarespace",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [
          {
            "id": "2e54ed5f-b700-4f33-bca7-7f26eeb7c7a7",
            "type": "paragraph",
            "children": [
              {
                "text": ""
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": -88.02459165257798,
        "y": 124.97739320143896
      },
      {
        "id": "403e2ce3-55c8-493d-a9f2-286722bf2c5c",
        "title": "Webflow",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [],
        "collection": [],
        "ancestry": [
          "217d6c98-d2e4-476e-8d78-062512cab635",
          "3027a638-7ed0-42b8-8921-f9d392182b0c"
        ],
        "x": -113.06962089658356,
        "y": 330.5457249764575
      },
      {
        "id": "ed305406-b180-4b11-8b8b-ec41815a8b32",
        "title": "Map out your ideas to be more readily understood by both machines and humans",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [
          {
            "id": "4c27a616-5d2a-4a5f-9318-2fd64e2c3cc4",
            "type": "paragraph",
            "level": 2,
            "children": [
              {
                "text": "Map out your ideas to be more readily understood by both machines and humans. "
              }
            ]
          },
          {
            "id": "509e1739-63ea-4973-a1c7-07d7562a849f",
            "type": "paragraph",
            "level": 2,
            "children": [
              {
                "text": "Making communication easier for humans makes it easier for machines as well. It is "
              },
              {
                "bold": true,
                "text": "not a trade-off"
              },
              {
                "text": "."
              }
            ]
          },
          {
            "id": "6c8764cd-defb-460c-a28a-b4f2978a9a73",
            "type": "paragraph",
            "level": 2,
            "children": [
              {
                "text": "Programming as a communication problem. You can make your message "
              },
              {
                "bold": true,
                "text": "more precise"
              },
              {
                "text": " for both machines and humans."
              }
            ]
          }
        ],
        "collection": [
          {
            "id": "afe0d351-bbf2-43e0-b44b-3adfb1c053fc",
            "type": "Space"
          }
        ],
        "ancestry": [
          "267f3769-2718-4967-bd4c-082b53f070d1",
          "3d144c96-b676-4cf1-84ff-b394c1442c52"
        ],
        "x": -42.537625406763595,
        "y": -40.265675059372455
      },
      {
        "id": "5e4ec480-a5b3-458a-ba80-1568677b0355",
        "title": "How Rumin solves programming as a communication problem",
        "content_type": "Space",
        "custom_fields": {},
        "json_body": [
          {
            "id": "4bd83ef9-389e-459f-9b7a-d113eac4345e",
            "type": "paragraph",
            "children": [
              {
                "text": "Rumin solves this using:"
              }
            ]
          },
          {
            "id": "dc13d0d4-1592-468c-94dd-2d9d3b99e05c",
            "type": "list-item",
            "children": [
              {
                "text": "GUI for interacting with the machines"
              }
            ]
          },
          {
            "id": "8279f6b3-3f0f-4125-a2e1-391c9d92bad1",
            "type": "list-item",
            "children": [
              {
                "text": "Built-in understanding: heuristics + natural language understanding"
              }
            ]
          },
          {
            "id": "01234a0f-c389-4f4f-8411-e7c4865548ad",
            "type": "list-item",
            "level": 2,
            "children": [
              {
                "text": "Symbolic AI + machine learning"
              }
            ]
          },
          {
            "type": "list-item",
            "children": [
              {
                "text": ""
              },
              {
                "url": "/spaces/afe0d351-bbf2-43e0-b44b-3adfb1c053fc",
                "type": "link",
                "children": [
                  {
                    "text": "Structure of interconnected ideas"
                  }
                ]
              },
              {
                "text": " that reflects the way you think - providing a "
              },
              {
                "url": "/spaces/f6abca07-af3a-4b13-b755-891fe76cc539",
                "type": "link",
                "children": [
                  {
                    "text": "shared context"
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          },
          {
            "id": "bd55b79b-5a1c-4f85-a338-0b78cbf266f0",
            "type": "paragraph",
            "children": [
              {
                "text": "Interactive communication; as opposed to one-way communication "
              }
            ]
          },
          {
            "id": "3b46df49-3d9e-4be6-ad90-5895cbfba496",
            "type": "paragraph",
            "children": [
              {
                "text": "\tAsynchronous communication"
              }
            ]
          },
          {
            "id": "25e7f921-8040-4942-8104-3bae57ae2442",
            "type": "paragraph",
            "children": [
              {
                "text": "Inputs (implicit and explicit) captured from the user via the UI, translated to an API (used for machines)."
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [
          "d36211f4-af5e-4887-ba69-c4f46f44a4c5"
        ],
        "x": -14.92981365158758,
        "y": -85.7900166155091
      },
      {
        "id": "de777cf4-3cfd-4119-9f03-b356b48c99c6",
        "title": "Blocks - Airtable",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://airtable.com/blocks",
          "favicon_url": null
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": ""
              },
              {
                "url": "/spaces/18298e6d-09e0-4e8d-81cf-b67764773e73",
                "type": "link",
                "children": [
                  {
                    "text": "Airtable Blocks"
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": -795.6134782673226,
        "y": 644.8866222552875,
        "centerX": -670.6134782673226,
        "centerY": 677.3866222552875
      },
      {
        "id": "2a0bebb7-f09c-4a54-921c-b8dc676e6693",
        "title": "Airtable extension",
        "content_type": "Space",
        "custom_fields": {
          "url": null,
          "favicon_url": null
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": ""
              },
              {
                "url": "/spaces/ce38598e-5a1b-4cf9-8864-86094f5681a4",
                "type": "link",
                "children": [
                  {
                    "text": "chrome extension"
                  }
                ]
              },
              {
                "text": ""
              },
              {
                "text": " for "
              },
              {
                "text": ""
              },
              {
                "url": "/spaces/b929db2c-11b7-48a6-8dfd-e5f0861d3330",
                "type": "link",
                "children": [
                  {
                    "text": "Airtable"
                  }
                ]
              },
              {
                "text": ""
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": -206.25965636322042,
        "y": 632.2763572958914,
        "centerX": -81.25965636322042,
        "centerY": 664.7763572958914
      },
      {
        "id": "0c5eab22-c5ef-4264-995e-85d89228d754",
        "title": "How is Parabola different than Zapier?",
        "content_type": "Space",
        "custom_fields": {
          "url": "https://learn.parabola.io/docs/faqs#how-is-parabola-different-than-zapier#content-container",
          "page_title": "Learn Parabola",
          "favicon_url": "https://files.readme.io/166bc19-favicon.ico"
        },
        "json_body": [
          {
            "type": "paragraph",
            "children": [
              {
                "text": "Zapier is great for moving small bits of data from one place to another when a triggering event occurs. Parabola focuses on what happens during transit, allowing you to create custom flows that reformat, group, filter, or enrich your data while it moves from place to place. Parabola works with a batch model, so rather than moving a single row when an event occurs, Parabola can move up to millions of rows at a time, on a schedule. While Zapier’s functionality is limited to pieces of the data set, Parabola supports table-based operations like aggregation, growth rates, and math. Zapier and Parabola can work well together, playing off of each other's strengths to create robust data solutions."
              }
            ]
          }
        ],
        "collection": [],
        "ancestry": [],
        "x": -914.5330124508691,
        "y": 223.42472064454438,
        "centerX": -789.5330124508691,
        "centerY": 255.92472064454438
      }
    ]

    const filteredResults = demoSearchData.filter(result => result.title && result.title.toLowerCase().includes(query.toLowerCase()))
    setSearchResults(filteredResults)
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
  }

  const handleKeyUp = (e) => {  
    if (props.demo === true) {
      updateDemoResults()
      return
    }

    clearTimeout(typingTimer)
    const timer = setTimeout(() => { fetchAutosuggest() }, 500)
    setTypingTimer(timer)
  }

  const handleSearchFocus = (e) => {
    // TODO - get the existing nodes in the current tab
    // getGraphDataByTab
    // how to rank them?
    if (!showASResults) {
      setShowASResults(true)
    }

    if (searchResults.length === 0) {
      const results = appContext.getCurrGraphData().nodes.slice(0, 10).map(r => {
        return appContext.getFetchedContentById(r.id) 
      })
      setExistingResults(results)
    }
  }

  const handleExistingResultClick = (result) => {
    props.panToExistingNode(result)
    closeASResults()
  }

  const handleResultAddClick = (result) => {
    let node = appContext.nodeFromContent(result) 
    props.insertNode(node)
    
    // close the menu
    setShowASResults(false)
    setQuery('')
  }

  const handleAddNewNodeClick = (node) => {
    props.insertNode(node)
    
    // close the menu
    setShowASResults(false)
    setQuery('')
  }

  const closeASResults = () => {
    setSearchResults([])
    setExistingResults([])
    setShowASResults(false)
  }

  const userIsAuthenticated = () => {
    return window.django.user.is_authenticated
  }

  const buildHamMenu = () => {
    if (props.isMobile()) return ''

    if (!userIsAuthenticated()) {
      return(
        <div className="right-side mr-1">
          <a href="/users/signup" className="btn-primary">Sign up</a>
        </div>
      )
    }

    return(
      <div className="ham-menu right-side mr-1">
        <div 
          className="icon-container clickable gray-text"
          role="button"
          onClick={() => setShowMenu(!showMenu)}
        >
            <i className="fa fa-bars"></i>
        </div>

        { buildHamMenuDropdown() }
      </div>
    )
  }

  const buildHamMenuDropdown = () => {
    if (!showMenu) return ''

    return(
      <ClickHandler
        close={() => setShowMenu(false)}
      >
        <HamMenuDropdown>
        </HamMenuDropdown>
      </ClickHandler>
    )
  }

  const buildExistingResults = () => {
    const filteredResults = appContext.getCurrGraphData().nodes.map(result => {
        return appContext.getFetchedContentById(result.id)
      }).filter(node => {
        return node.title && node.title.toLowerCase().includes(query.toLowerCase())
    })

    return filteredResults.slice(0, 10).map((result, index) => {
      return(
        <li 
          className="top-as-result clickable clickable-blue flex flex-center"
          onClick={() => handleExistingResultClick(result)}
        >
          <span>
            { result.title || 'Untitled' }
          </span>
          <span 
            className="right-side"
            title="Go to node in graph" 
          >
            <i className="fa fa-dot-circle-o"></i>
          </span>
        </li>
      )
    })
  }

  const buildSearchResults = () => {
    if (isFetchingAS) {
      return(
        <li className="top-as-result flex flex-center gray-text">
          fetching more results...
        </li>
      )      
    }

    if (searchResults.length === 0) return []

    return searchResults.map((result, index) => {
      return(
        <li 
          className="top-as-result clickable clickable-blue flex flex-center"
          onClick={() => handleResultAddClick(result)}
        >
          <span>
            { result.title || 'Untitled' }
          </span>
          <span 
            className="right-side"
            title="Add to the current graph"
          >
            <i className="fa fa-plus"></i>
          </span>
        </li>
      )
    })
  }

  const buildResults = () => {
    if (!showASResults) return ''

    const newNode = {
      id: uuid.v4(),
      title: query,
      content_type: 'Space'
    }
    const createNodeBtn = (
      <li 
        className="top-as-result clickable clickable-blue flex flex-center"
        onClick={() => handleAddNewNodeClick(newNode)}
      >
        <span>
          Create Page "{ query }"
        </span>
        <span 
          className="right-side"
          title="Add to the current graph"
        >
          <i className="fa fa-plus"></i>
        </span>
      </li>
    )

    return(
      <div
        className="top-search-as"
      >
        <ClickHandler
          close={closeASResults}
        >
          <ul 
            className="top-as-results" 
            // onScroll={handleScroll}
          >
            { buildExistingResults() } 
            { buildSearchResults() }
            { query.length > 0 && createNodeBtn }
          </ul>
        </ClickHandler>
      </div>
    )
  }

  return(
    <div className="header-section">
      <div className="top-bar flex border-bottom">
        <div className="mr-1">
          <a href="/" className="mb-0" style={{color: '#2D6EAB', fontFamily: 'Varela Round, sans-serif', display: 'flex', 'alignItems': 'center'}}>
            <img src="https://storage.googleapis.com/rumin-gcs-bucket/logo-search2.png" className="logo-img" /> 
          </a>
        </div>

        <div className="search-box-container relative">
          <input 
            ref={inputRef}
            value={query}
            className="search-box" 
            placeholder="Find or add a page" 
            onChange={handleQueryChange}
            onKeyUp={handleKeyUp}
            onFocus={handleSearchFocus}
          />
          <div 
            className="search-icon-container"
            // onClick={handleSearchClick}
          >
            <svg focusable="false" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285f4" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
          </div>
          { buildResults() }
        </div>

        { buildHamMenu() }
      </div>
    </div>
  )
})
