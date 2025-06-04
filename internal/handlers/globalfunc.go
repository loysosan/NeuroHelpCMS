package handlers

import (
	"crypto/rand"
	"encoding/hex"


	"github.com/go-ini/ini"
	"github.com/rs/zerolog/log"

)

// Global configuration variable
var cfg *ini.File
var cfgAuth *ini.File
var jwtKey []byte
var jwtUserKey []byte

func init() {
	var err error
	cfgAuth, err = ini.Load("config.ini")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config.ini")
	}
	jwtKey = []byte(cfgAuth.Section("auth").Key("jwt_admin_secret").String())
	jwtUserKey = []byte(cfgAuth.Section("auth").Key("jwt_user_secret").String())
}

// generateToken creates a secure random token of n bytes, hex-encoded.
func generateToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}