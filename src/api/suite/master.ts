import { Router } from 'express';
import axios from "axios";
import fs from 'fs';
import path from "path";
import { reloadMaster } from "@master"
import {ClientErrorResponse, SuiteMasterGetResponse} from "@proto";
import {decrypt} from "@util/decrypt";
import BZip2 from "bzip2-wasm";
import {encrypt} from "@util/encrypt";

const router = Router()

router.get('/', async (req, res) => {
    let buffer;
    let baseUrl;

    switch(process.env.SERVER) {
        case 'TW':
            baseUrl = 'https://v1010-bd.mobimon.com.tw';
            break;
        case 'JP':
            baseUrl = 'https://api.garupa.jp'
            break;
        case 'GL':
            baseUrl = 'https://api.app-bang-dream-gbp.com'
            break;
        case 'CN':
            baseUrl = 'https://l3-prod-all-bd.bilibiligame.net'
            break;
    }

    let headers = {
        'User-Agent': req.get("User-Agent") as string,
        'Content-Type': req.get("Content-Type") as string,
        'Accept': req.get("Accept") as string,
        'Accept-Encoding': req.get("Accept-Encoding") as string,
        'x-clientversion': req.get("x-clientversion") as string,
    }

    if(process.env.SERVER == "CN") {
        headers = {
            ...headers,
            'x-platformid': req.get("x-platformid") as string,
            'x-deviceid': req.get("x-deviceid") as string,
            'x-channelid': req.get("x-channelid") as string,
            'x-clientplatform': req.get("x-clientplatform") as string,
        }
    }

    try {
        const resp = await axios.get(`${baseUrl}/api/suite/master`, {
            responseType: 'arraybuffer',
            headers
        });

        if(process.env.SERVER !== "JP") {
            const bzip2 = new BZip2();

            await bzip2.init();

            const dec = decrypt(resp.data)
            const decompressed = bzip2.decompress(dec, dec.length * 20)
            const master = SuiteMasterGetResponse.toJSON(SuiteMasterGetResponse.decode(decompressed));
            master.masterMusicList.entries.push(
                {
                    "musicId": 84,
                    "musicTitle": "深愛",
                    "bgmId": "bgm084",
                    "bgmFile": "084_shin_ai",
                    "lyricist": "水樹奈々",
                    "composer": "上松範康（Elements Garden）",
                    "tag": "anime",
                    "arranger": "都丸椋太（Elements Garden）",
                    "ruby": "しんあい",
                    "bandId": 5,
                    "howToGet": "ＣｉＲＣＬＥの楽曲ショップで交換",
                    "achievements": [
                        {
                            "musicId": 84,
                            "achievementType": "combo_easy",
                            "rewardType": "coin",
                            "quantity": 5000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "combo_expert",
                            "rewardType": "coin",
                            "quantity": 20000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "combo_hard",
                            "rewardType": "coin",
                            "quantity": 15000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "combo_normal",
                            "rewardType": "coin",
                            "quantity": 10000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "combo_special",
                            "rewardType": "coin",
                            "quantity": 20000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "full_combo_easy",
                            "rewardType": "coin",
                            "quantity": 10000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "full_combo_expert",
                            "rewardType": "star",
                            "quantity": 50
                        },
                        {
                            "musicId": 84,
                            "achievementType": "full_combo_hard",
                            "rewardType": "star",
                            "quantity": 50
                        },
                        {
                            "musicId": 84,
                            "achievementType": "full_combo_normal",
                            "rewardType": "coin",
                            "quantity": 20000
                        },
                        {
                            "musicId": 84,
                            "achievementType": "full_combo_special",
                            "rewardType": "star",
                            "quantity": 50
                        },
                        {
                            "musicId": 84,
                            "achievementType": "score_rank_a",
                            "rewardType": "practice_ticket",
                            "rewardId": 2,
                            "quantity": 1
                        },
                        {
                            "musicId": 84,
                            "achievementType": "score_rank_b",
                            "rewardType": "practice_ticket",
                            "rewardId": 2,
                            "quantity": 1
                        },
                        {
                            "musicId": 84,
                            "achievementType": "score_rank_c",
                            "rewardType": "practice_ticket",
                            "rewardId": 2,
                            "quantity": 1
                        },
                        {
                            "musicId": 84,
                            "achievementType": "score_rank_s",
                            "rewardType": "star",
                            "quantity": 50
                        },
                        {
                            "musicId": 84,
                            "achievementType": "score_rank_ss",
                            "rewardType": "star",
                            "quantity": 50
                        }
                    ],
                    "jacketImage": "084_shin_ai",
                    "seq": 1407,
                    "publishedAt": "1513576800000",
                    "closedAt": "4102714800000",
                    "transitionMethod": "music_shop",
                    "phonetic": "シンアイ",
                    "musicDataType": "normal",
                    "categorySetId": 32
                },
            )
            master.masterMusicJacketMap.entries["84"] = {
                "entries": [
                    {
                        "musicJacketId": 118,
                        "musicId": 84,
                        "seq": 5,
                        "jacketImage": "084_shin_ai",
                        "startAt": "1513576800000"
                    }
                ]
            }
            master.masterMusicDifficultyList.entries.push(
                {
                    "musicId": 84,
                    "difficulty": "easy",
                    "playLevel": 8,
                    "multiLiveScoreMap": {
                        "2001": {
                            "musicId": 84,
                            "musicDifficulty": "easy",
                            "multiLiveDifficultyId": 2001,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "daredemo",
                            "scoreSS": 4320000
                        },
                        "2011": {
                            "musicId": 84,
                            "musicDifficulty": "easy",
                            "multiLiveDifficultyId": 2011,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "standard",
                            "scoreSS": 4320000
                        },
                        "2021": {
                            "musicId": 84,
                            "musicDifficulty": "easy",
                            "multiLiveDifficultyId": 2021,
                            "scoreS": 7560000,
                            "scoreA": 6480000,
                            "scoreB": 4680000,
                            "scoreC": 2520000,
                            "multiLiveDifficultyType": "grand",
                            "scoreSS": 8460000
                        },
                        "2031": {
                            "musicId": 84,
                            "musicDifficulty": "easy",
                            "multiLiveDifficultyId": 2031,
                            "scoreS": 10080000,
                            "scoreA": 8820000,
                            "scoreB": 7560000,
                            "scoreC": 5040000,
                            "multiLiveDifficultyType": "legend",
                            "scoreSS": 11340000,
                            "scoreSSS": 12600000
                        }
                    },
                    "notesQuantity": 1000,
                    "scoreS": 648000,
                    "scoreA": 432000,
                    "scoreB": 216000,
                    "scoreC": 36000,
                    "scoreSS": 864000
                },
                {
                    "musicId": 84,
                    "difficulty": "expert",
                    "playLevel": 25,
                    "multiLiveScoreMap": {
                        "2001": {
                            "musicId": 84,
                            "musicDifficulty": "expert",
                            "multiLiveDifficultyId": 2001,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "daredemo",
                            "scoreSS": 4320000
                        },
                        "2011": {
                            "musicId": 84,
                            "musicDifficulty": "expert",
                            "multiLiveDifficultyId": 2011,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "standard",
                            "scoreSS": 4320000
                        },
                        "2021": {
                            "musicId": 84,
                            "musicDifficulty": "expert",
                            "multiLiveDifficultyId": 2021,
                            "scoreS": 7560000,
                            "scoreA": 6480000,
                            "scoreB": 4680000,
                            "scoreC": 2520000,
                            "multiLiveDifficultyType": "grand",
                            "scoreSS": 8460000
                        },
                        "2031": {
                            "musicId": 84,
                            "musicDifficulty": "expert",
                            "multiLiveDifficultyId": 2031,
                            "scoreS": 10080000,
                            "scoreA": 8820000,
                            "scoreB": 7560000,
                            "scoreC": 5040000,
                            "multiLiveDifficultyType": "legend",
                            "scoreSS": 11340000,
                            "scoreSSS": 12600000
                        }
                    },
                    "notesQuantity": 1000,
                    "scoreS": 648000,
                    "scoreA": 432000,
                    "scoreB": 216000,
                    "scoreC": 36000,
                    "scoreSS": 864000
                },
                {
                    "musicId": 84,
                    "difficulty": "hard",
                    "playLevel": 20,
                    "multiLiveScoreMap": {
                        "2001": {
                            "musicId": 84,
                            "musicDifficulty": "hard",
                            "multiLiveDifficultyId": 2001,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "daredemo",
                            "scoreSS": 4320000
                        },
                        "2011": {
                            "musicId": 84,
                            "musicDifficulty": "hard",
                            "multiLiveDifficultyId": 2011,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "standard",
                            "scoreSS": 4320000
                        },
                        "2021": {
                            "musicId": 84,
                            "musicDifficulty": "hard",
                            "multiLiveDifficultyId": 2021,
                            "scoreS": 7560000,
                            "scoreA": 6480000,
                            "scoreB": 4680000,
                            "scoreC": 2520000,
                            "multiLiveDifficultyType": "grand",
                            "scoreSS": 8460000
                        },
                        "2031": {
                            "musicId": 84,
                            "musicDifficulty": "hard",
                            "multiLiveDifficultyId": 2031,
                            "scoreS": 10080000,
                            "scoreA": 8820000,
                            "scoreB": 7560000,
                            "scoreC": 5040000,
                            "multiLiveDifficultyType": "legend",
                            "scoreSS": 11340000,
                            "scoreSSS": 12600000
                        }
                    },
                    "notesQuantity": 1000,
                    "scoreS": 648000,
                    "scoreA": 432000,
                    "scoreB": 216000,
                    "scoreC": 36000,
                    "scoreSS": 864000
                },
                {
                    "musicId": 84,
                    "difficulty": "normal",
                    "playLevel": 14,
                    "multiLiveScoreMap": {
                        "2001": {
                            "musicId": 84,
                            "musicDifficulty": "normal",
                            "multiLiveDifficultyId": 2001,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "daredemo",
                            "scoreSS": 4320000
                        },
                        "2011": {
                            "musicId": 84,
                            "musicDifficulty": "normal",
                            "multiLiveDifficultyId": 2011,
                            "scoreS": 3240000,
                            "scoreA": 2160000,
                            "scoreB": 1080000,
                            "scoreC": 180000,
                            "multiLiveDifficultyType": "standard",
                            "scoreSS": 4320000
                        },
                        "2021": {
                            "musicId": 84,
                            "musicDifficulty": "normal",
                            "multiLiveDifficultyId": 2021,
                            "scoreS": 7560000,
                            "scoreA": 6480000,
                            "scoreB": 4680000,
                            "scoreC": 2520000,
                            "multiLiveDifficultyType": "grand",
                            "scoreSS": 8460000
                        },
                        "2031": {
                            "musicId": 84,
                            "musicDifficulty": "normal",
                            "multiLiveDifficultyId": 2031,
                            "scoreS": 10080000,
                            "scoreA": 8820000,
                            "scoreB": 7560000,
                            "scoreC": 5040000,
                            "multiLiveDifficultyType": "legend",
                            "scoreSS": 11340000,
                            "scoreSSS": 12600000
                        }
                    },
                    "notesQuantity": 1000,
                    "scoreS": 648000,
                    "scoreA": 432000,
                    "scoreB": 216000,
                    "scoreC": 36000,
                    "scoreSS": 864000
                }
            )

            buffer = encrypt(bzip2.compress(SuiteMasterGetResponse.encode(SuiteMasterGetResponse.fromJSON(master)).finish()));
        } else {
            buffer = resp.data
        }

        fs.writeFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2")}`, Buffer.from(buffer));
    } catch(e) {
        console.log(ClientErrorResponse.decode(decrypt(e.response.data)))
        buffer = fs.readFileSync(`${path.join(process.cwd(), "resp", process.env.SERVER, "suitemaster.bz2")}`)
    }

    res.set({
        'content-length': Buffer.byteLength(buffer),
        'content-type': 'application/octet-stream',
        'x-encoding': 'bzip2'
    });

    res.send(buffer)

    reloadMaster();
})

export default router;