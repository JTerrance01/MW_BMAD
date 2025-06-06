using Quartz;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Jobs
{
    /// <summary>
    /// Base interface for all jobs that transition competitions between states
    /// </summary>
    public interface ICompetitionTransitionJob : IJob
    {
        /// <summary>
        /// Process all competitions that need transition according to the job's criteria
        /// </summary>
        Task ProcessDueCompetitionsAsync();
    }
}