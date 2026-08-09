import { Router } from "express";
import { UserProfileSearchResponse } from "@proto";
import { db } from "@db";
import { encrypt } from "@util/encrypt";
import { getMaster } from "@master";
import { computeMusicClearInfo, buildUserSituations, buildUserProfileDegree, buildCharacterRankMap } from "@util/helpers";

const router = Router({ mergeParams: true });

const BAND_RANK_MAP = Object.fromEntries([1, 2, 3, 4, 5, 18, 21, 45].map(id => [id, 67]));
const DECK_RATING_MAP = Object.fromEntries(
    [1, 2, 3, 4, 5, 18, 21, 45].map(id => [id, { rank: "c", score: 0, lowerRating: 1, upperRating: 1600000 }])
);

router.put('/', async (req, res) => {
    // @ts-ignore
    const targetid = req.params.targetid
    const user = db.Users[process.env.SERVER].find((u: any) => u.userId == targetid);
    const master = getMaster();

    let data: any;

    if (!user) {
        data = { searchSuccessFlg: false };
    } else {
        const userSituations = buildUserSituations(user.userId, master);
        const mainDeck = user.decks[user.mainDeck - 1];
        const situationIds = [mainDeck.leader, mainDeck.member1, mainDeck.member2, mainDeck.member3, mainDeck.member4].filter(Boolean);

        data = {
            userProfile: {
                userName: user.userName,
                rank: user.rank,
                degree: 100,
                introduction: user.introduction,
                searchableFlg: true,
                publishUpdatedAtFlg: true,
                friendApplicableFlg: true,
                publishStageChallengeFriendRankingFlg: true,
                mainDeckUserSituations: {
                    entries: situationIds.map(sid => userSituations.find((s: any) => s.situationId === sid))
                },
                enabledUserAreaItems: {},
                bandRankMap: { entries: BAND_RANK_MAP },
                userHighScoreRating: {
                    userPoppinPartyHighScoreMusicList: {},
                    userPastelPalettesHighScoreMusicList: {},
                    userRoseliaHighScoreMusicList: {},
                    userOtherHighScoreMusicList: {},
                    userMorfonicaHighScoreMusicList: {},
                    userRaiseASuilenHighScoreMusicList: {},
                    userMyGOScoreMusicList: {}
                },
                mainUserDeck: user.decks[user.mainDeck - 1],
                userProfileSituation: {},
                userProfileDegreeMap: { entries: buildUserProfileDegree(user.userId, user) },
                userTwitter: {},
                userDeckTotalRatingMap: { entries: DECK_RATING_MAP },
                stageChallengeAchievementConditionsMap: {},
                userMusicClearInfoMap: computeMusicClearInfo(user.musicScore),
                userCharacterRankMap: buildCharacterRankMap()
            }
        };
    }

    const message = UserProfileSearchResponse.fromJSON(data);
    const buffer = Buffer.from(UserProfileSearchResponse.encode(message).finish());
    const encBuffer = encrypt(buffer);

    res.send(encBuffer)
})

export default router;