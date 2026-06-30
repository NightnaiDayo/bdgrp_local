import { Router } from "express";
import { UserEventStoryMemorialResponse } from "@proto";
import { getMaster } from "@master";
import {encrypt} from "@util/encrypt";
import { getEvents/*, getPastEventStories*/ } from "@util/event";

const router = Router({ mergeParams: true });

router.get('/', async(req, res) => {
    const userid = req.params.userid;

    const master = getMaster();

    let serverIndex: number

    switch(process.env.SERVER) {
        case 'TW':
            serverIndex = 2
            break;
        case 'JP':
            serverIndex = 0
            break;
    }

    const evdata = await getEvents();

    // @ts-ignore
    const pastEvents = Object.entries(evdata)
        .map(([id, ev]: [string, any]) => ({
            eventId: Number(id),
            eventType: ev.eventType,
            eventName: ev.eventName?.[serverIndex] ?? ev.eventName?.[0],
            startAt: ev.startAt?.[serverIndex] ?? ev.startAt?.[0],
            endAt: ev.endAt?.[serverIndex] ?? ev.endAt?.[0],
            assetBundleName: ev.assetBundleName,
            characterIdList: ev.characters?.map((c: any) => c.characterId) ?? []
        }))
        .filter(e => e.startAt && e.endAt && Number(e.endAt) < Date.now());

    const data = {
        userEventStoryMemorialMap: {
            entries: Object.fromEntries(
                Object.entries(master.masterEventStoryMemorialConfigMap.entries).map(([eventId, config]: [string, any]) => [
                    eventId,
                    {
                        eventId: Number(eventId),
                        userEventStoryList: {
                            entries: [{
                                userId: userid,
                                eventId: Number(eventId),
                                status: "already_read"
                            }]
                        },
                        isExistUnReadStory: false,
                        isLocked: false
                    }
                ])
            )
        },
        pastEventMap: {
            entries: Object.fromEntries(
                pastEvents.map((e: any) => [
                    e.eventId,
                    {
                        eventId: e.eventId,
                        eventType: e.eventType,
                        eventName: e.eventName,
                        assetBundleName: e.assetBundleName,
                        startAt: e.startAt,
                        endAt: e.endAt,
                        enableFlg: true,
                        publicStartAt: e.startAt,
                        publicEndAt: master.masterEventStoryMemorialConfigMap.entries[String(e.eventId)]?.eventPublicEndAt || e.endAt,
                        distributionStartAt: e.startAt,
                        distributionEndAt: e.endAt,
                        bgmAssetBundleName: "",
                        bgmFileName: "",
                        aggregateEndAt: e.endAt,
                        eventExchangesEndAt: e.endAt,
                        receptionEndAt: e.endAt
                    }
                ])
            )
        },
        pastEventCharacterListMap: {
            entries: Object.fromEntries(
                pastEvents.map(e => [e.eventId, { entries: e.characterIdList }])
            )
        },
        pastEventStoryMap: {
            entries: Object.fromEntries(
                pastEvents.map(e => [e.eventId, { entries: [] }])
            )
        }
    }

    res.send(encrypt(Buffer.from(UserEventStoryMemorialResponse.encode(UserEventStoryMemorialResponse.fromJSON(data)).finish())))
})

export default router;