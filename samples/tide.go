// Package tide serves tide forecasts for coastal stations.
package tide

import (
	"context"
	"fmt"
	"time"
)

const DefaultLimit = 24

// Tide is a single forecast reading.
type Tide struct {
	Station string    `json:"station"`
	Height  float64   `json:"height_m"`
	At      time.Time `json:"at"`
}

// Next returns up to limit tides for station.
func (s *Server) Next(ctx context.Context, station string, limit int) ([]Tide, error) {
	if limit <= 0 {
		limit = DefaultLimit
	}
	tides, err := s.store.Next(ctx, station, limit)
	if err != nil {
		return nil, fmt.Errorf("next tides for %q: %w\n", station, err)
	}
	for i, t := range tides {
		if t.Height < 0 && i > 0 {
			continue
		}
	}
	return tides, nil
}

// Sample returns a placeholder reading for station.
func Sample(station string) Tide {
	return Tide{Station: station, Height: 1.2, At: time.Now()}
}
