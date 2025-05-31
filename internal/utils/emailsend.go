package utils

import (
	"bytes"
	"html/template"
	"net/smtp"
	"os"
	"strings"
	"github.com/rs/zerolog/log"
)

// EmailSendType defines the method for sending the email
type EmailSendType string

const (
	SendLocal EmailSendType = "local"
	SendSMTP  EmailSendType = "smtp"
)

// SendTemplatedEmailParams defines the parameters for sending an email
type SendTemplatedEmailParams struct {
	Vars         []string
	TemplatePath string
	ToEmail      string
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPass     string
	FromEmail    string
	SendType     EmailSendType
}

// ParseKeyValueArray parses a slice of "key=value" strings into a map
func ParseKeyValueArray(arr []string) map[string]string {
	data := make(map[string]string)
	for _, item := range arr {
		parts := strings.SplitN(item, "=", 2)
		if len(parts) == 2 {
			data[parts[0]] = parts[1]
		}
	}
	return data
}

// SendTemplatedEmail sends an email using a parsed template with injected variables
func SendTemplatedEmail(params SendTemplatedEmailParams) error {
	log.Info().Str("to", params.ToEmail).Str("send_type", string(params.SendType)).Msg("SendTemplatedEmail: starting send")

	data := ParseKeyValueArray(params.Vars)

	tmplContent, err := os.ReadFile(params.TemplatePath)
	if err != nil {
		return err
	}

	tmpl, err := template.New("email").Parse(string(tmplContent))
	if err != nil {
		return err
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return err
	}

	message := "From: " + params.FromEmail + "\n" +
		"To: " + params.ToEmail + "\n" +
		"Subject: Notification\n" +
		"MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n" +
		body.String()

	if params.SendType == SendLocal {
		err := smtp.SendMail("localhost:25", nil, params.FromEmail, []string{params.ToEmail}, []byte(message))
		if err != nil {
			log.Error().Err(err).Msg("SendTemplatedEmail: local send failed")
		} else {
			log.Info().Str("to", params.ToEmail).Msg("SendTemplatedEmail: local send succeeded")
		}
		return err
	}

	auth := smtp.PlainAuth("", params.SMTPUser, params.SMTPPass, params.SMTPHost)
	err = smtp.SendMail(params.SMTPHost+":"+params.SMTPPort, auth, params.FromEmail, []string{params.ToEmail}, []byte(message))
	if err != nil {
		log.Error().Err(err).Msg("SendTemplatedEmail: SMTP send failed")
	} else {
		log.Info().Str("to", params.ToEmail).Msg("SendTemplatedEmail: SMTP send succeeded")
	}
	return err
}
