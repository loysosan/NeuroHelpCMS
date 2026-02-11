FROM golang:1.24-alpine

WORKDIR /app

RUN go mod init user-api || true

COPY . .
RUN go mod tidy

RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init --generalInfo cmd/main.go --output docs

RUN go build -o main ./cmd/main.go

CMD ["./main"]