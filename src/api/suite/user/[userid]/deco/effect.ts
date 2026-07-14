import { Router } from "express";
import {SuiteMasterGetResponse, UserDecoEquipmentGetResponse} from "@proto"
import { encrypt } from "@util/encrypt";
import { db } from "@db";
import { getMaster } from "@master";


const router = Router({ mergeParams: true })

router.get('/', async(req, res) => {
    const master = getMaster();
    // @ts-ignore
    const userid = req.params.userid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == userid);
    const mainDeck = user.decks[user.mainDeck - 1]

    const userProfileDegree = {
        "first": {
            userId: Number(userid),
            profileDegreeType: "first",
            degreeId: user.degree[0]
        }
    }
    // @ts-ignore
    if(user.degree[1]) userProfileDegree["second"] = {
        userId: Number(userid),
        profileDegreeType: "second",
        degreeId: user.degree[1]
    }

    const data = {
        updateResources: {
            userDecoEffectInventoryMap: {
                entries: Object.fromEntries(
                    master.masterDecoEffectList.entries
                        .filter(e => Number(e.startAt) <= Date.now() && Number(e.endAt) >= Date.now())
                        .map(e => [
                            e.decoEffectId,
                            {
                                userId: Number(userid),
                                decoEffectId: e.decoEffectId
                            }
                        ])
                )
            },
            userDecoEquipment: {
                userDecoCharacterSituation: {
                    userId: userid,
                    situationId: user.decos["situation"]?.situationId ?? 1,
                    situationStatus: user.decos["situation"]?.situationStatus ?? "normal"
                },
                userDecoCharacterLive2d: {
                    userId: userid,
                    characterId: user.decos["live2d"]?.characterId ?? master.masterCharacterSituationMap.entries[mainDeck.leader].characterId,
                    costumeId: user.decos["live2d"]?.costumeId ?? user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].costumeId,
                    motionId: user.decos["live2d"]?.motionId ?? Object.values(master.masterDecoCharacterLive2dMotionMap.entries)
                        .filter(m => m.characterId === master.masterCharacterSituationMap.entries[mainDeck.leader].characterId)
                        .sort((a, b) => a.seq - b.seq)[0].motionId,
                    backgroundId: user.decos["live2d"]?.backgroundId ?? 1
                },
                userDecoCharacter3d: {
                    userId: userid,
                    characterId: user.decos["3d"]?.characterId ?? master.masterCharacterSituationMap.entries[mainDeck.leader].characterId,
                    dressId: user.decos["3d"]?.dressId ?? user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].dressId,
                    hairstyleId: user.decos["3d"]?.hairstyleId ?? user.wearingCostume[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId].hairstyleId,
                    motionId: user.decos["3d"]?.motionId ?? master.masterEnableCharacter3dMotionTypeMap.entries[master.masterCharacterSituationMap.entries[mainDeck.leader].characterId]
                        ?.entries?.deco?.entries
                        ?.sort((a, b) => a.seq - b.seq)[0].motionId,
                    backgroundId: user.decos["3d"]?.backgroundId ?? 11
                },
                userDecoFramePins: {
                    userId: userid,
                    decoFrameId: user.decos.frameId ?? 0,
                    decoPinsId1: user.decos["framepins"][0] ?? 0,
                    decoPinsId2: user.decos["framepins"][1] ?? 0,
                    decoPinsId3: user.decos["framepins"][2] ?? 0,
                    decoPinsId4: user.decos["framepins"][3] ?? 0,
                    decoPinsId5: user.decos["framepins"][4] ?? 0,
                },
                userDecoDegreeMap: {
                    entries: userProfileDegree
                },
                userDecoAppealMap: {},
                userDecoSetting: {
                    useProfileSettingDegree: user.useProfileSettingDegree,
                    useProfileSettingSituation: user.useProfileSettingSituation,
                    selectedCharacterType: user.selectedCharacterType
                },
                userDecoEffect: {
                    userId: userid,
                    decoEffectId: user.decos.effect ?? 1
                }
            }
        }
    }

    res.send(encrypt(Buffer.from(UserDecoEquipmentGetResponse.encode(UserDecoEquipmentGetResponse.fromJSON(data)).finish())))
})

export default router;