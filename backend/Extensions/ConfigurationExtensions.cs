namespace backend.Extensions
{
    public static class ConfigurationExtensions
    {
        public static IConfigurationBuilder AddDotEnvFile(this IConfigurationBuilder builder, string filePath = ".env")
        {
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"Warning: .env file not found at {filePath}");
                return builder;
            }

            var envVars = new Dictionary<string, string?>();
            
            foreach (var line in File.ReadAllLines(filePath))
            {
                var trimmedLine = line.Trim();
                
                // Skip empty lines and comments
                if (string.IsNullOrEmpty(trimmedLine) || trimmedLine.StartsWith("#"))
                    continue;
                
                var equalIndex = trimmedLine.IndexOf('=');
                if (equalIndex > 0)
                {
                    var key = trimmedLine.Substring(0, equalIndex).Trim();
                    var value = trimmedLine.Substring(equalIndex + 1).Trim();
                    
                    // Remove quotes if present
                    if ((value.StartsWith("\"") && value.EndsWith("\"")) || 
                        (value.StartsWith("'") && value.EndsWith("'")))
                    {
                        value = value.Substring(1, value.Length - 2);
                    }
                    
                    envVars[key] = value;
                    
                    // Set environment variable for current process
                    Environment.SetEnvironmentVariable(key, value);
                }
            }
            
            builder.AddInMemoryCollection(envVars);
            Console.WriteLine($"✅ Loaded {envVars.Count} environment variables from {filePath}");
            
            return builder;
        }
    }
}