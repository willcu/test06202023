import {RGBot} from 'rg-bot'
import RGCTFUtils, {CTFEvent} from 'rg-ctf-utils'
import {Vec3} from 'vec3'
import {Item} from 'prismarine-item'
import {Entity} from 'prismarine-entity'

import {
    handleAttackFlagCarrier,
    handleAttackNearbyOpponent,
    handleBotIdlePosition,
    handleCollectingFlag,
    handleLootingItems, handleLowHealth,
    handlePlacingBlocks, handleScoringFlag
} from './lib/MainLoopFunctions';

const armorManager = require('mineflayer-armor-manager')

const {
    getUnbreakableBlockIds,
    nearestTeammates,
    throttleRunTime,
    nameForItem
} = require('./lib/HelperFunctions')

/**
 * This capture the flag bot covers most possibilities you could have in a main loop bot.
 * Macro level strategies and tuning are up to you.
 */
export function configureBot(bot: RGBot) {

    // Disable rg-bot debug logging.  You can enable this to see more details about rg-bot api calls
    bot.setDebug(false)

    // Allow parkour so that our bots pathfinding will jump short walls and optimize their path for sprint jumps.
    bot.allowParkour(true)

    // We recommend disabling this on as you can't dig the CTF map.  Turning this on can lead pathfinding to get stuck.
    bot.allowDigWhilePathing(false)

    // Setup the rg-ctf-utils with debug logging
    const rgctfUtils = new RGCTFUtils(bot)
    rgctfUtils.setDebug(true)

    // Load the armor-manager plugin (https://github.com/PrismarineJS/MineflayerArmorManager)
    bot.mineflayer().loadPlugin(armorManager)

    // default to true in-case we miss the start
    let matchInProgress = true

    // Information about the unbreakable block types
    const unbreakable: number[] = getUnbreakableBlockIds(bot)
    console.log(`Unbreakable blocks: ${JSON.stringify(unbreakable)}`)


    // Listeners for key events.  This bot uses these for logging information for debugging.
    // You may use these for actions, but this main loop bot does not
    bot.on('match_ended', async(matchInfo) => {
        const points = matchInfo?.players.find(player => player.username == bot.username())?.metadata?.score
        const captures = matchInfo?.players.find(player => player.username == bot.username())?.metadata?.flagCaptures
        console.log(`The match has ended - I had ${captures} captures and scored ${points} points`)
        matchInProgress = false
    })

    bot.on('match_started', async(matchInfo) => {
        console.log(`The match has started`)
        matchInProgress = true
    })

    bot.on(CTFEvent.FLAG_OBTAINED, async (collector: string) => {
        console.log(`Flag picked up by ${collector}`)
        if (collector == bot.username()) {
            console.log('I have the flag... yippee !!!')
        }
    })

    bot.on(CTFEvent.FLAG_SCORED, async (teamName: string) => {
        console.log(`Flag scored by ${teamName} team`)
    })

    bot.on(CTFEvent.FLAG_AVAILABLE, async (position: Vec3) => {
        console.log('Flag is available')
    })


    // Part of using a main loop is being careful not to leave it running at the wrong time.
    // It is very easy to end up with 2 loops running by accident.
    // Here we track the mainLoop instance count and update on key events.
    let mainLoopInstanceTracker = 0

    bot.on('playerLeft', (player) => {
        if(player.username == bot.username()) {
            console.log(`!*!*!*! I have left.. uh oh...`)
            ++mainLoopInstanceTracker
        }
    })

    bot.on('end', () => {
        console.log(`!*!*!*! I have disconnected...`)
        ++mainLoopInstanceTracker
    })

    bot.on('kicked', () => {
        console.log(`!*!*!*! I have been kicked...`)
        ++mainLoopInstanceTracker
    })

    bot.on('death', () => {
        console.log('!*!*!*! I have died...')
        ++mainLoopInstanceTracker
        try {
            // stop any current goal
            // @ts-ignore
            bot.mineflayer().pathfinder.setGoal(null)
            // @ts-ignore
            bot.mineflayer().pathfinder.stop()
        } catch (ex) {

        }
    })




    // You could write all the code inside this spawn listener, but we separate it out into its own mainLoop function
    bot.on('spawn', async () => {
        bot.chat(`I have come to win Capture The Flag with my main loop.`)
        await mainLoop()
    })

    // =================================
    // Main Loop
    // =================================
    async function mainLoop() {
        const currentMainLoopInstance = mainLoopInstanceTracker

        // make sure our loop exits quickly on death/disconnect/kick/etc
        const isActiveFunction = () => {return matchInProgress && currentMainLoopInstance===mainLoopInstanceTracker}
        while (isActiveFunction()) {
            throw new Error("fail!!")
        }
        console.log('BOT Loop End...')
    }

}