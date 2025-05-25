FROM golang:1.23-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init --generalInfo cmd/main.go --output docs

RUN go build -o main ./cmd/main.go

CMD ["./main"]