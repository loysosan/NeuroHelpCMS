package unit_tests

// Common utility functions for tests

// stringPtr returns a pointer to the provided string
func stringPtr(s string) *string {
	return &s
}

// intPtr returns a pointer to the provided int
func intPtr(i int) *int {
	return &i
}

// uint64Ptr returns a pointer to the provided uint64
func uint64Ptr(u uint64) *uint64 {
	return &u
}
