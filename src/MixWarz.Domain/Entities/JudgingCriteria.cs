using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MixWarz.Domain.Entities
{
    /// <summary>
    /// Defines the criteria used for judging submissions in competitions
    /// </summary>
    public class JudgingCriteria
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CompetitionId { get; set; }

        /// <summary>
        /// Name of the criteria (e.g., "Technical Clarity", "Creative Balance")
        /// </summary>
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        /// <summary>
        /// Description of what this criteria evaluates
        /// </summary>
        [StringLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Type of scoring input: Slider, Stars, RadioButtons
        /// </summary>
        [Required]
        public ScoringType ScoringType { get; set; }

        /// <summary>
        /// Minimum score value (e.g., 1 for 1-10 slider, 1 for 1-5 stars)
        /// </summary>
        [Required]
        public int MinScore { get; set; }

        /// <summary>
        /// Maximum score value (e.g., 10 for 1-10 slider, 5 for 1-5 stars)
        /// </summary>
        [Required]
        public int MaxScore { get; set; }

        /// <summary>
        /// Weight of this criteria in overall scoring (0.0 to 1.0)
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(5,4)")]
        public decimal Weight { get; set; }

        /// <summary>
        /// Display order for this criteria in the judging interface
        /// </summary>
        [Required]
        public int DisplayOrder { get; set; }

        /// <summary>
        /// Whether comments are required for this criteria
        /// </summary>
        [Required]
        public bool IsCommentRequired { get; set; } = false;

        /// <summary>
        /// JSON string containing scoring options for radio button type criteria
        /// Example: ["Poor", "Fair", "Good", "Excellent"]
        /// </summary>
        public string? ScoringOptions { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        public virtual Competition Competition { get; set; } = null!;
        public virtual ICollection<CriteriaScore> CriteriaScores { get; set; } = new List<CriteriaScore>();
    }

    /// <summary>
    /// Defines the type of scoring input for a judging criterion
    /// </summary>
    public enum ScoringType
    {
        /// <summary>
        /// Slider input (e.g., 1-10 scale)
        /// </summary>
        Slider = 1,

        /// <summary>
        /// Star rating input (e.g., 1-5 stars)
        /// </summary>
        Stars = 2,

        /// <summary>
        /// Radio button selection (e.g., Poor/Fair/Good/Excellent)
        /// </summary>
        RadioButtons = 3
    }
}