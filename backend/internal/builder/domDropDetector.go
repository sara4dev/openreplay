package builder

import (
	. "openreplay/backend/pkg/messages"
)

const DROP_WINDOW = 200  //ms
const CRITICAL_COUNT = 1 // Our login page contains 20. But on crush it removes only roots (1-3 nodes).
// TODO: smart detection (making whole DOM tree would eat all memory)

type domDropDetector struct {
	removedCount      int
	lastDropTimestamp uint64
}

func (dd *domDropDetector) reset() {
	dd.removedCount = 0
	dd.lastDropTimestamp = 0
}

func (dd *domDropDetector) Handle(message Message, _ uint64, timestamp uint64) Message {
	switch message.(type) {
	case *CreateElementNode,
		*CreateTextNode:
		dd.removedCount = 0
		dd.lastDropTimestamp = 0
	case *RemoveNode:
		if dd.lastDropTimestamp+DROP_WINDOW > timestamp {
			dd.removedCount += 1
		} else {
			dd.removedCount = 1
		}
		dd.lastDropTimestamp = timestamp
	}
	return nil
}

func (dd *domDropDetector) Build() Message {
	if dd.removedCount >= CRITICAL_COUNT {
		domDrop := &DOMDrop{
			Timestamp: dd.lastDropTimestamp,
		}
		dd.reset()
		return domDrop
	}
	dd.reset()
	return nil
}
