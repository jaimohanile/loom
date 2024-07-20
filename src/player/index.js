
import { lazy } from './utils'
import { createReactPlayer } from './ReactPlayer'

const MATCH_URL_LOOM = /loom\.com\/(share|embed)\/([a-zA-Z0-9_-]+)(\?[^#]*)?/
// Fall back to FilePlayer if nothing else can play the URL
const players = [

    {
        key: 'loom',
        name: 'Loom',
        canPlay: (url) => MATCH_URL_LOOM.test(url),
        lazyPlayer: lazy(() => import(/* webpackChunkName: 'reactPlayerVimeo' */'./Loom'))
    }
]

const fallback = players[players.length - 1]

export default createReactPlayer(players, fallback)
